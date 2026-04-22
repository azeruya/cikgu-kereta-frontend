<template>
  <div class="dash">
    <Sidebar
      :collapsed="collapsed"
      :menu="menu"
      :user="currentUser"
      @toggle="collapsed = !collapsed"
    />

    <div class="main">
      <div class="top-bar">
        <div>
          <div class="page-title">Expenses</div>
          <div class="page-date">Track operating expenses and bookkeeping records</div>
        </div>

        <div class="top-right">
          <input
            class="search"
            v-model.trim="searchQuery"
            placeholder="Search category / description..."
          />
          <button class="pill-btn" type="button">Export</button>
          <button class="pill-btn primary" type="button">
            + Add Expense
          </button>
        </div>
      </div>

      <div class="expense-grid">
        <Card>
          <template #header>
            <span class="card-title">Expense List</span>
            <span class="card-link">{{ filteredExpenses.length }} record(s)</span>
          </template>

          <div v-if="loading" class="empty-state">Loading expenses...</div>

          <template v-else>
            <table class="table" v-if="filteredExpenses.length > 0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Receipt</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="expense in filteredExpenses"
                  :key="expense.id"
                  class="clickable-row"
                  @click="openDetail(expense)"
                >
                  <td>{{ formatDate(expense.expense_date) }}</td>
                  <td>
                    <span class="status-pill" :class="categoryClass(expense.category)">
                      {{ expense.category || "-" }}
                    </span>
                  </td>
                  <td>
                    <div class="item-name">{{ expense.description || "-" }}</div>
                  </td>
                  <td>RM {{ formatMoney(expense.amount) }}</td>
                  <td>{{ expense.receipt_file ? "Available" : "-" }}</td>
                </tr>
              </tbody>
            </table>

            <div v-else class="empty-state">
              No expenses found.
            </div>

            <div class="pagination" v-if="totalPages > 1">
              <button @click="prevPage" :disabled="page === 1">←</button>
              <span>{{ page }} / {{ totalPages }}</span>
              <button @click="nextPage" :disabled="page === totalPages">→</button>
            </div>
          </template>
        </Card>

        <div class="stack-col">
          <Card>
            <template #header>
              <span class="card-title">Overview</span>
            </template>

            <div class="summary-stack">
              <div class="summary-line">
                <span>Total Records</span>
                <b>{{ expenses.length }}</b>
              </div>
              <div class="summary-line">
                <span>Total Expenses</span>
                <b>RM {{ formatMoney(totalExpenses) }}</b>
              </div>
              <div class="summary-line">
                <span>This Month</span>
                <b>RM {{ formatMoney(monthExpenses) }}</b>
              </div>
            </div>
          </Card>

          <Card>
            <template #header>
              <span class="card-title">By Category</span>
            </template>

            <div v-if="categoryTotals.length === 0" class="empty-small">
              No expense categories found.
            </div>

            <div v-else class="category-list">
              <div
                v-for="row in categoryTotals"
                :key="row.category"
                class="category-row"
              >
                <div class="item-name">{{ row.category }}</div>
                <div class="job-price">RM {{ formatMoney(row.total) }}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div class="modal" v-if="activeExpense" @click.self="closeDetail">
        <div v-if="detailLoading" class="modal-card">
          <div class="empty-state">Loading expense detail...</div>
        </div>

        <div v-else class="modal-card large">
          <div class="modal-header">
            <span>{{ activeExpense.category || "Expense Detail" }}</span>
            <button class="mini-btn" @click="closeDetail">✕</button>
          </div>

          <div class="modal-body">
            <div class="expense-detail-grid">
              <div><b>Date:</b> {{ formatDate(activeExpense.expense_date) }}</div>
              <div><b>Category:</b> {{ activeExpense.category || "-" }}</div>
              <div><b>Amount:</b> RM {{ formatMoney(activeExpense.amount) }}</div>
              <div><b>Receipt:</b> {{ activeExpense.receipt_file ? "Available" : "-" }}</div>
              <div class="full">
                <b>Description:</b> {{ activeExpense.description || "-" }}
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button>Edit</button>
            <button class="primary">View Receipt</button>
          </div>
        </div>
      </div>

      <div v-if="error" class="page-error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";
import Card from "../components/Card.vue";
import api from "../services/api";

export default {
  components: {
    Sidebar,
    Card
  },

  data() {
    return {
      collapsed: false,
      loading: false,
      detailLoading: false,
      error: "",

      menu: [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Expenses", path: "/expenses", icon: "alert" },
        { name: "Reports", path: "/reports", icon: "chart" }
      ],

      expenses: [],
      page: 1,
      totalPages: 1,
      searchQuery: "",
      activeExpense: null
    };
  },

  computed: {
    currentUser() {
      try {
        return JSON.parse(localStorage.getItem("user")) || null;
      } catch {
        return null;
      }
    },

    filteredExpenses() {
      let list = this.expenses || [];

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter((e) =>
          (e.category || "").toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q)
        );
      }

      return list;
    },

    totalExpenses() {
      return this.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    },

    monthExpenses() {
      const now = new Date();
      return this.expenses
        .filter((e) => {
          if (!e.expense_date) return false;
          const d = new Date(e.expense_date);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    },

    categoryTotals() {
      const grouped = {};

      this.expenses.forEach((e) => {
        const key = e.category || "Uncategorized";
        grouped[key] = (grouped[key] || 0) + Number(e.amount || 0);
      });

      return Object.entries(grouped)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
    }
  },

  mounted() {
    this.fetchExpenses();
  },

  methods: {
    getCacheKey(page = 1) {
      return `expenses-page-${page}`;
    },

    async fetchExpenses(page = 1) {
      const cacheKey = this.getCacheKey(page);
      const cached = sessionStorage.getItem(cacheKey);

      this.error = "";

      if (cached) {
        const parsed = JSON.parse(cached);
        this.expenses = parsed.data || [];
        this.page = parsed.current_page || 1;
        this.totalPages = parsed.last_page || 1;
      } else {
        this.loading = true;
      }

      try {
        const res = await api.get(`/expenses?page=${page}`);
        this.expenses = res.data.data || [];
        this.page = res.data.current_page || 1;
        this.totalPages = res.data.last_page || 1;

        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
      } catch (error) {
        console.error("Error fetching expenses:", error);
        this.error =
          error.response?.data?.message || "Failed to load expenses.";
      } finally {
        this.loading = false;
      }
    },

    async openDetail(expense) {
      this.activeExpense = {
        id: expense.id,
        category: expense.category,
        amount: expense.amount,
        expense_date: expense.expense_date,
        description: expense.description,
        receipt_file: expense.receipt_file
      };

      this.detailLoading = true;
      this.error = "";

      try {
        const res = await api.get(`/expenses/${expense.id}`);
        this.activeExpense = res.data;
      } catch (error) {
        console.error("Error loading expense detail:", error);
        this.error =
          error.response?.data?.message || "Failed to load expense detail.";
      } finally {
        this.detailLoading = false;
      }
    },

    closeDetail() {
      this.activeExpense = null;
      this.detailLoading = false;
    },

    nextPage() {
      if (this.page < this.totalPages) {
        this.fetchExpenses(this.page + 1);
      }
    },

    prevPage() {
      if (this.page > 1) {
        this.fetchExpenses(this.page - 1);
      }
    },

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    formatDate(value) {
      if (!value) return "-";
      return new Date(value).toLocaleDateString("en-GB");
    },

    categoryClass(category) {
      const c = (category || "").toLowerCase();

      if (c.includes("salary")) return "sp-blue";
      if (c.includes("utility")) return "sp-amber";
      if (c.includes("purchase")) return "sp-green";
      return "sp-gray";
    }
  }
};
</script>

<style scoped>
.expense-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 16px;
}

.stack-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f2f2f0;
}

.category-row:last-child {
  border-bottom: none;
}

.expense-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  font-size: 12px;
  color: #555;
}

.expense-detail-grid .full {
  grid-column: 1 / -1;
}

@media (max-width: 1100px) {
  .expense-grid,
  .expense-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>