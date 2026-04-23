<template>
  <div class="dash">
    <Sidebar
    :collapsed="collapsed"
    :menu="menu"
    :user="currentUser"
    @toggle="collapsed = !collapsed"
    @logout="handleLogout"
    />

    <div class="main">
      <div class="top-bar">
        <div class="page-intro">
          <div class="page-title-row">
            <div class="page-title">Expenses</div>
            <span class="page-chip">{{ expenses.length }} records</span>
          </div>

          <div class="page-date">
            Track operating expenses and bookkeeping records
          </div>
        </div>

        <div class="top-right">
          <input
            class="search"
            v-model.trim="searchQuery"
            placeholder="Search category / description..."
          />
          <button class="pill-btn" type="button" @click="exportCsv">
            Export CSV
          </button>
          <button class="pill-btn primary" type="button" @click="openFormModal()">
            + Add Expense
          </button>
        </div>
      </div>

      <div class="expense-grid">
        <Card>
          <template #header>
            <span class="card-title">Expense List</span>
            <span class="card-link">
              {{ filteredExpenses.length }} record{{ filteredExpenses.length === 1 ? '' : 's' }}
            </span>
          </template>

          <div class="filters-bar">
            <input type="date" v-model="fromDate" />
            <input type="date" v-model="toDate" />

            <select v-model="categoryFilter">
              <option value="">All Categories</option>
              <option>Salary</option>
              <option>Utility</option>
              <option>Purchase</option>
              <option>Maintenance</option>
              <option>Misc</option>
            </select>

            <button class="pill-btn" @click="fetchExpenses(1)">Apply</button>
            <button class="pill-btn" @click="clearFilters">Reset</button>
          </div>

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
                  <th>Actions</th>
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

                  <td>
                    <span v-if="expense.receipt_file" class="link-text">Available</span>
                    <span v-else>-</span>
                  </td>

                  <td>
                    <div class="action-group" @click.stop>
                      <button class="mini-btn" @click="openDetail(expense)">View</button>
                      <button class="mini-btn" @click="openFormModal(expense)">Edit</button>
                      <button class="mini-btn" @click="confirmDelete(expense)">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-else class="empty-state">
              No expenses found.
              <div style="margin-top:10px;">
                <button class="pill-btn primary" @click="openFormModal()">+ Add Expense</button>
              </div>
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
              <span class="card-title">Monthly Trend</span>
            </template>

            <div v-if="monthlyChart.length === 0" class="empty-small">
              No monthly data.
            </div>

            <div v-else class="mini-chart">
              <div
                v-for="bar in normalizedMonthlyChart"
                :key="bar.label"
                class="mini-chart-col"
              >
                <div class="mini-chart-bar-wrap">
                  <div class="mini-chart-bar" :style="{ height: bar.height + 'px' }"></div>
                </div>
                <div class="mini-chart-label">{{ bar.label }}</div>
                <div class="mini-chart-value">RM {{ shortMoney(bar.total) }}</div>
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

      <!-- Detail Modal -->
    <Teleport to="body">
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
              <div>
                <b>Receipt:</b>
                <template v-if="activeExpense.receipt_file">
                  Available
                </template>
                <template v-else>-</template>
              </div>
              <div class="full">
                <b>Description:</b> {{ activeExpense.description || "-" }}
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="openFormModal(activeExpense)">Edit</button>
            <button @click="confirmDelete(activeExpense)">Delete</button>
            <button
              class="primary"
              :disabled="!activeExpense.receipt_file"
              @click="viewReceipt(activeExpense)"
            >
              View Receipt
            </button>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal" v-if="showFormModal" @click.self="closeFormModal">
        <div class="modal-card large">
          <div class="modal-header">
            <span>{{ editingExpenseId ? "Edit Expense" : "Add Expense" }}</span>
            <button class="mini-btn" @click="closeFormModal">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-grid">
              <div class="field">
                <label>Category</label>
                <select v-model="form.category">
                  <option value="">Select category</option>
                  <option>Salary</option>
                  <option>Utility</option>
                  <option>Purchase</option>
                  <option>Maintenance</option>
                  <option>Misc</option>
                </select>
              </div>

              <div class="field">
                <label>Expense Date</label>
                <input v-model="form.expense_date" type="date" />
              </div>

              <div class="field">
                <label>Amount</label>
                <input v-model="form.amount" type="number" step="0.01" min="0.01" />
              </div>

              <div class="field">
                <label>Receipt File</label>
                <input type="file" @change="handleReceiptUpload" accept=".jpg,.jpeg,.png,.pdf" />
              </div>

              <div class="field full">
                <label>Description</label>
                <textarea v-model="form.description" rows="4" placeholder="Optional notes"></textarea>
              </div>
            </div>

            <div v-if="formError" class="page-error" style="margin-top:12px;">
              {{ formError }}
            </div>
          </div>

          <div class="modal-actions">
            <button @click="closeFormModal">Cancel</button>
            <button class="primary" :disabled="savingForm" @click="submitExpense">
              {{ savingForm ? "Saving..." : (editingExpenseId ? "Update" : "Create") }}
            </button>
          </div>
        </div>
      </div>
         </Teleport>

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
      savingForm: false,
      error: "",
      formError: "",

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
      activeExpense: null,
      summary: {},
      fromDate: "",
      toDate: "",
      categoryFilter: "",
      showFormModal: false,
      editingExpenseId: null,
      form: {
        category: "",
        description: "",
        amount: "",
        expense_date: "",
        receipt_file: null
      }
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
      return this.summary?.total || 0;
    },

    monthExpenses() {
      return this.summary?.monthly || 0;
    },

    categoryTotals() {
      return this.summary?.category_totals || [];
    },

    monthlyChart() {
      return this.summary?.monthly_chart || [];
    },

    normalizedMonthlyChart() {
      const max = Math.max(...this.monthlyChart.map((x) => Number(x.total || 0)), 0);

      return this.monthlyChart.map((item) => ({
        ...item,
        height: max > 0 ? Math.max(12, (Number(item.total || 0) / max) * 70) : 12
      }));
    }
  },

  mounted() {
    this.fetchExpenses();
  },

  methods: {
    async handleLogout() {
        try {
            await api.post("/logout");
        } catch (error) {
            console.warn("Logout request failed, clearing local session anyway.", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            sessionStorage.clear();
            this.$router.push("/login");
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
        this.error = error.response?.data?.message || "Failed to load expense detail.";
      } finally {
        this.detailLoading = false;
      }
    },

    closeDetail() {
      this.activeExpense = null;
      this.detailLoading = false;
    },

    openFormModal(expense = null) {
      this.formError = "";

      if (expense) {
        this.editingExpenseId = expense.id;
        this.form = {
          category: expense.category || "",
          description: expense.description || "",
          amount: expense.amount || "",
          expense_date: expense.expense_date || "",
          receipt_file: null
        };
      } else {
        this.editingExpenseId = null;
        this.form = {
          category: "",
          description: "",
          amount: "",
          expense_date: "",
          receipt_file: null
        };
      }

      this.showFormModal = true;
    },

    closeFormModal() {
      this.showFormModal = false;
      this.editingExpenseId = null;
      this.formError = "";
    },

    handleReceiptUpload(event) {
      this.form.receipt_file = event.target.files[0] || null;
    },

    async submitExpense() {
      this.savingForm = true;
      this.formError = "";

      try {
        const formData = new FormData();
        formData.append("category", this.form.category);
        formData.append("description", this.form.description || "");
        formData.append("amount", this.form.amount);
        formData.append("expense_date", this.form.expense_date);

        if (this.form.receipt_file) {
          formData.append("receipt_file", this.form.receipt_file);
        }

        if (this.editingExpenseId) {
          formData.append("_method", "PUT");
          await api.post(`/expenses/${this.editingExpenseId}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        } else {
          await api.post("/expenses", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }

        this.closeFormModal();
        this.clearExpenseCache();
        await this.fetchExpenses(this.page);
      } catch (error) {
        console.error("Error saving expense:", error);
        this.formError = error.response?.data?.message || "Failed to save expense.";
      } finally {
        this.savingForm = false;
      }
    },

    async confirmDelete(expense) {
      const ok = confirm(`Delete this expense (${expense.category})?`);
      if (!ok) return;

      try {
        await api.delete(`/expenses/${expense.id}`);

        if (this.activeExpense?.id === expense.id) {
          this.closeDetail();
        }

        this.clearExpenseCache();
        await this.fetchExpenses(this.page);
      } catch (error) {
        console.error("Error deleting expense:", error);
        this.error = error.response?.data?.message || "Failed to delete expense.";
      }
    },

    async exportCsv() {
      try {
        const res = await api.get("/expenses/export/csv", {
          params: {
            search: this.searchQuery || undefined,
            category: this.categoryFilter || undefined,
            from_date: this.fromDate || undefined,
            to_date: this.toDate || undefined
          },
          responseType: "blob"
        });

        const blob = new Blob([res.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "expenses.csv";
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error exporting CSV:", error);
        this.error = "Failed to export CSV.";
      }
    },

    viewReceipt(expense) {
      if (!expense.receipt_file) return;

      const base = import.meta.env.VITE_API_BASE_URL?.replace("/api", "") || "http://127.0.0.1:8000";
      window.open(`${base}/storage/${expense.receipt_file}`, "_blank");
    },

    clearFilters() {
      this.fromDate = "";
      this.toDate = "";
      this.categoryFilter = "";
      this.fetchExpenses(1);
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

    shortMoney(value) {
      const num = Number(value || 0);
      if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
      return num.toFixed(0);
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
      if (c.includes("maintenance")) return "sp-purple";
      return "sp-gray";
    },
    
    getExpenseCacheKey(page = 1) {
    return `expenses-${page}-${JSON.stringify({
        search: this.searchQuery || "",
        category: this.categoryFilter || "",
        from: this.fromDate || "",
        to: this.toDate || ""
    })}`;
    },

    clearExpenseCache() {
    Object.keys(sessionStorage)
        .filter(k => k.startsWith("expenses-"))
        .forEach(k => sessionStorage.removeItem(k));
    },

    async fetchExpenses(page = 1) {
    const cacheKey = this.getExpenseCacheKey(page);
    const cached = sessionStorage.getItem(cacheKey);

    this.error = "";

    if (cached) {
        const parsed = JSON.parse(cached);
        this.expenses = parsed.data || [];
        this.page = parsed.current_page || 1;
        this.totalPages = parsed.last_page || 1;
        this.summary = parsed.summary || {};
    } else {
        this.loading = true;
    }

    try {
        const res = await api.get("/expenses", {
        params: {
            page,
            search: this.searchQuery || undefined,
            category: this.categoryFilter || undefined,
            from_date: this.fromDate || undefined,
            to_date: this.toDate || undefined
        }
        });

        this.expenses = res.data.data || [];
        this.page = res.data.current_page || 1;
        this.totalPages = res.data.last_page || 1;
        this.summary = res.data.summary || {};

        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
    } catch (error) {
        console.error("Error fetching expenses:", error);
        this.error = error.response?.data?.message || "Failed to load expenses.";
    } finally {
        this.loading = false;
    }
    },
  },

  watch: {
    searchQuery() {
      this.fetchExpenses(1);
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

.filters-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}

.filters-bar input,
.filters-bar select {
  height: 36px;
  padding: 0 10px;
  border-radius: 10px;
  border: 1px solid #e5e5e5;
  font-size: 12px;
  background: #fff;
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

.mini-chart {
  display: flex;
  align-items: end;
  gap: 10px;
  height: 120px;
}

.mini-chart-col {
  flex: 1;
  text-align: center;
}

.mini-chart-bar-wrap {
  height: 80px;
  display: flex;
  align-items: end;
  justify-content: center;
}

.mini-chart-bar {
  width: 100%;
  max-width: 22px;
  background: #111;
  border-radius: 8px 8px 0 0;
}

.mini-chart-label {
  margin-top: 8px;
  font-size: 11px;
  color: #666;
}

.mini-chart-value {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}

.link-text {
  font-size: 12px;
  color: #3366cc;
  font-weight: 600;
}

.sp-purple {
  background: #f2eaff;
  color: #7b3fe4;
}

@media (max-width: 1100px) {
  .expense-grid,
  .expense-detail-grid {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-wrap: wrap;
  }
}
</style>