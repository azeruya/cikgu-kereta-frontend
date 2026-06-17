<template>
  <div class="dash">
    <Sidebar
    :collapsed="collapsed"
    :menu="menu"
    :user="currentUser"
    @toggle="toggleSidebar"
    @logout="handleLogout"
    />

    <div class="main">
      <div class="page-header">
        <div class="page-intro">
          <div class="page-title-row">
            <div class="page-title">Expenses</div>
            <span class="page-chip">{{ expenses.length }} records</span>
          </div>

          <div class="page-subtitle">
            Track operating expenses and bookkeeping records
          </div>
        </div>

        <div class="page-actions">
          <input
            class="search-input"
            v-model.trim="searchQuery"
            placeholder="Search category / description..."
          />
          <button class="btn btn-secondary btn-pill" type="button" @click="exportCsv">
            Export CSV
          </button>
          <button class="btn btn-primary btn-pill" type="button" @click="openFormModal()">
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

            <button class="btn btn-secondary btn-pill" @click="applyFilters">Apply</button>
            <button class="btn btn-secondary btn-pill" @click="clearFilters">Reset</button>
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
                    <span class="badge" :class="categoryBadgeClass(expense.category)">
                      {{ expense.category || "-" }}
                    </span>
                  </td>

                  <td>
                    <div
                      class="description-cell"
                      :class="{ empty: !expense.description }"
                    >
                      {{ expense.description || "No description" }}
                    </div>
                  </td>

                  <td>
                    <span class="money-cell">RM {{ formatMoney(expense.amount) }}</span>
                  </td>

                  <td class="center">
                    <button
                      v-if="expense.receipt_file"
                      class="icon-btn icon-btn-info"
                      @click.stop="viewReceipt(expense)"
                      title="Open receipt"
                    >
                      <svg viewBox="0 0 24 24" class="icon-svg">
                        <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2z" />
                        <path d="M9 8h6" />
                        <path d="M9 12h6" />
                        <path d="M9 16h3" />
                      </svg>
                    </button>

                    <span v-else class="empty-inline">No receipt</span>
                  </td>

                  <td class="right">
                    <div class="icon-btn-group" @click.stop>
                      <button
                        class="icon-btn"
                        title="View expense"
                        @click="openDetail(expense)"
                      >
                        <svg viewBox="0 0 24 24" class="icon-svg">
                          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>

                      <button
                        class="icon-btn"
                        title="Edit expense"
                        @click="openFormModal(expense)"
                      >
                        <svg viewBox="0 0 24 24" class="icon-svg">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                        </svg>
                      </button>

                      <button
                        class="icon-btn icon-btn-danger"
                        title="Delete expense"
                        @click="openDeleteModal(expense)"
                      >
                        <svg viewBox="0 0 24 24" class="icon-svg">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 15H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-else class="empty-state">
              No expenses found.
              <div style="margin-top:10px;">
                <button class="btn btn-primary btn-pill" @click="openFormModal()">+ Add Expense</button>
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

            <div class="summary-list">
              <div class="summary-row">
                <span>Total Records</span>
                <b>{{ summary.total_records }}</b>
              </div>
              <div class="summary-row">
                <span>Total Expenses</span>
                <b>RM {{ formatMoney(summary.total_expenses) }}</b>
              </div>
              <div class="summary-row">
                <span>This Month</span>
                <b>RM {{ formatMoney(summary.this_month) }}</b>
              </div>
            </div>
          </Card>

          <Card>
            <template #header>
              <span class="card-title">Monthly Trend</span>
            </template>

            <div v-if="monthlyTrend.length === 0" class="empty-small">
              No monthly data.
            </div>

            <div v-else-if="monthlyTrend.length === 1" class="single-trend-card">
              <div>
                <div class="single-trend-label">{{ monthlyTrend[0].label }}</div>
                <div class="single-trend-value">
                  RM {{ formatMoney(monthlyTrend[0].total) }}
                </div>
              </div>
              <span class="single-trend-note">Only one month recorded</span>
            </div>

            <div v-else class="trend-list">
              <div
                v-for="row in monthlyTrend"
                :key="row.label"
                class="trend-row"
              >
                <div>
                  <div class="trend-label">{{ row.label }}</div>
                  <div class="trend-sub">Operating expenses</div>
                </div>

                <strong>RM {{ formatMoney(row.total) }}</strong>
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
              <div class="category-name-wrap">
                  <span class="dot-indicator" :class="categoryDotClass(row.category)"></span>
                  <span class="item-name">{{ row.category }}</span>
                </div>
                <div class="job-price">RM {{ formatMoney(row.total) }}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Detail Modal -->
      <Teleport to="body">
        <div class="modal" v-if="activeExpense" @click.self="closeDetail">
          <div v-if="detailLoading" class="modal-card large">
            <div class="modal-header">
              <span>Expense Detail</span>
              <button class="btn btn-sm btn-ghost" @click="closeDetail">✕</button>
            </div>

            <div class="modal-body modal-detail-body">
              <div class="detail-section">
                <div class="skeleton-line title"></div>
                <div class="skeleton-grid">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line"></div>
                </div>
              </div>
            </div>
          </div>

        <div v-else class="modal-card large">
        <div class="modal-header">
          <span>{{ activeExpense.category || "Expense Detail" }}</span>
          <button class="btn btn-sm btn-ghost" @click="closeDetail">✕</button>
        </div>

        <div class="modal-body modal-detail-body">
          <div class="detail-section">
            <div class="section-title">Expense Information</div>

            <div class="info-list">
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">Date</span>
                  <span class="info-value">{{ formatDate(activeExpense.expense_date) }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Category</span>
                  <span class="info-value">{{ activeExpense.category || "-" }}</span>
                </div>
              </div>

              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">Amount</span>
                  <span class="info-value">RM {{ formatMoney(activeExpense.amount) }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Receipt</span>
                  <span class="info-value">
                    {{ activeExpense.receipt_file ? "Available" : "-" }}
                  </span>
                </div>
              </div>

              <div class="info-row last">
                <div class="info-item full">
                  <span class="info-label">Description</span>
                  <span class="info-value">{{ activeExpense.description || "-" }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer split">
          <div class="left-actions">
            <button @click="openFormModal(activeExpense)" class="btn btn-secondary btn-pill">Edit</button>
            <button
              class="btn btn-primary btn-pill"
              :disabled="!activeExpense.receipt_file"
              @click="viewReceipt(activeExpense)"
            >
              View Receipt
            </button>
          </div>

          <button class="btn btn-danger-light btn-pill" @click="openDeleteModal(activeExpense)">
            Delete
          </button>
        </div>
      </div>
    </div>
      </Teleport>

      <!-- Delete Confirmation Modal -->
      <Teleport to="body">
        <div
          v-if="showDeleteModal"
          class="modal-overlay"
          @click.self="closeDeleteModal"
        >
          <div class="confirm-card">
            <div class="confirm-icon confirm-icon-danger">!</div>

            <div class="confirm-title">Delete expense?</div>

            <div class="confirm-message">
              Are you sure you want to delete this
              <strong>{{ expenseToDelete?.category }}</strong>
              expense? This action cannot be undone.
            </div>

            <div class="confirm-actions">
              <button
                type="button"
                class="btn btn-secondary btn-pill"
                :disabled="deletingExpense"
                @click="closeDeleteModal"
              >
                Cancel
              </button>

              <button
                type="button"
                class="btn btn-danger btn-pill"
                :disabled="deletingExpense"
                @click="confirmDeleteExpense"
              >
                {{ deletingExpense ? "Deleting..." : "Delete" }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

        <!-- Add/Edit Expense Form Modal -->
        <Teleport to="body">
          <div v-if="showFormModal" class="modal" @click.self="closeFormModal">
            <div class="modal-card large form-modal-card">
              <div class="modal-header">
                <span>{{ editingExpenseId ? "Edit Expense" : "Add Expense" }}</span>
                <button type="button" class="btn btn-sm btn-ghost" @click="closeFormModal">✕</button>
              </div>

              <div class="modal-body form-modal-body">
                <div class="form-section">
                  <div class="section-title">Expense Information</div>

                  <div class="form-grid">
                    <div class="form-field">
                      <label>Date</label>
                      <input v-model="form.expense_date" type="date" />
                    </div>

                    <div class="form-field">
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

                    <div class="form-field">
                      <label>Amount</label>
                      <input
                        v-model.number="form.amount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>

                    <div class="form-field">
                      <label>Receipt</label>

                      <label class="file-upload">
                        <span class="file-upload-button">Choose file</span>
                        <span class="file-upload-name">
                          {{ receiptFileName || "No file selected" }}
                        </span>

                        <input
                          type="file"
                          accept="image/*,.pdf"
                          @change="handleReceiptFile"
                        />
                      </label>
                    </div>

                    <div class="form-field full">
                      <label>Description</label>
                      <textarea
                        v-model="form.description"
                        rows="3"
                        placeholder="Optional expense note"
                      ></textarea>
                    </div>

                     <div v-if="editingExpenseId && form.existing_receipt" class="receipt-chip">
                    <div class="receipt-chip-left">
                      <svg class="receipt-chip-icon" viewBox="0 0 16 16">
                        <path d="M5 2h5l3 3v9H5z" />
                        <path d="M10 2v3h3" />
                        <path d="M7 8h4" />
                        <path d="M7 11h4" />
                      </svg>

                      <div>
                        <div class="receipt-chip-title">Receipt uploaded</div>
                        <div class="receipt-chip-sub">Choose a new file to replace it</div>
                      </div>
                    </div>

                  <button
                    type="button"
                    class="receipt-chip-action"
                    @click="viewReceipt({ receipt_file: form.existing_receipt })"
                  >
                    View
                  </button>
                  </div>
                    </div>
                  </div>
     

                <div v-if="formError" class="page-error" style="margin-top:12px;">
                  {{ formError }}
                </div>
              </div>

              <div class="modal-footer form-actions">
                <button type="button" class="btn btn-secondary btn-pill" @click="closeFormModal">Cancel</button>
                <button
                  type="button"
                  class="btn btn-primary btn-pill"
                  :disabled="savingForm"
                  @click="submitExpense"
                >
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
      collapsed: localStorage.getItem("sidebar-collapsed") === "true",
      loading: false,
      detailLoading: false,
      savingForm: false,
      error: "",
      formError: "",

      expenses: [],
      page: 1,
      totalPages: 1,
      perPage: 8,
      totalRecords: 0,
      searchQuery: "",
      activeExpense: null,
      summary: {
        total_records: 0,
        total_expenses: 0,
        this_month: 0,
      },

      monthlyTrend: [],
      categoryTotals: [],
      fromDate: "",
      toDate: "",
      categoryFilter: "",
      showDeleteModal: false,
      expenseToDelete: null,
      deletingExpense: false,
      showFormModal: false,
      editingExpenseId: null,
      searchTimer: null,
      receiptFileName: "",
      form: {
        category: "",
        description: "",
        amount: "",
        expense_date: "",
        receipt_file: null,
        existing_receipt: null  
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

    menu() {
      const baseMenu = [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Expenses", path: "/expenses", icon: "alert" },
      ];

      if (this.currentUser?.role === "admin") {
        baseMenu.push(
          { name: "Reports", path: "/reports", icon: "chart" },
          { name: "Users", path: "/users", icon: "user" }
        );
      }

      return baseMenu;
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

    normalizedMonthlyChart() {
      const max = Math.max(
        ...this.monthlyTrend.map((x) => Number(x.total || 0)),
        0
      );

      return this.monthlyTrend.map((item) => ({
        ...item,
        height: max > 0 ? Math.max(12, (Number(item.total || 0) / max) * 70) : 12,
      }));
    },
  },

  mounted() {
    this.fetchExpenses();
    this.fetchExpenseSummary();
  },

  methods: {
    toggleSidebar() {
      this.collapsed = !this.collapsed;
      localStorage.setItem("sidebar-collapsed", String(this.collapsed));
    },

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

    handleReceiptFile(event) {
      const file = event.target.files?.[0] || null;

      this.form.receipt_file = file;
      this.receiptFileName = file ? file.name : "";
    },

    applyFilters() {
      this.page = 1;
      this.fetchExpenses(1);
      this.fetchExpenseSummary();
    },

    clearFilters() {
      this.fromDate = "";
      this.toDate = "";
      this.categoryFilter = "";
      this.searchQuery = "";
      this.page = 1;

      this.fetchExpenses(1);
      this.fetchExpenseSummary();
    },

    openFormModal(expense = null) {
  this.formError = "";

  if (expense) {
    this.editingExpenseId = expense.id;

    this.form = {
      expense_date: expense.expense_date
        ? String(expense.expense_date).slice(0, 10)
        : "",
      category: expense.category || "",
      amount: Number(expense.amount || 0),
      description: expense.description || "",
      receipt_file: null,
      existing_receipt: expense.receipt_file || null,
    };
  } else {
    this.editingExpenseId = null;

    this.form = {
      expense_date: new Date().toISOString().slice(0, 10),
      category: "",
      amount: "",
      description: "",
      receipt_file: null,
      existing_receipt: null,
    };
  }

  this.showFormModal = true;
},

    closeFormModal() {
      this.showFormModal = false;
      this.editingExpenseId = null;
      this.formError = "";
    },

    viewReceipt(expense) {
      const file = expense?.receipt_file;

      if (!file) {
        this.error = "No receipt file found.";
        return;
      }

      if (file.startsWith("http://") || file.startsWith("https://")) {
        window.open(file, "_blank");
        return;
      }

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
        "http://127.0.0.1:8000";

      window.open(`${baseUrl}/storage/${encodeURI(file)}`, "_blank");
    },

    async submitExpense() {
      this.formError = "";
      this.savingForm = true;

      try {
        const formData = new FormData();

        formData.append("expense_date", this.form.expense_date);
        formData.append("category", this.form.category);
        formData.append("amount", this.form.amount || 0);
        formData.append("description", this.form.description || "");

        if (this.form.receipt_file) {
          formData.append("receipt_file", this.form.receipt_file);
        }

        let res;

        if (this.editingExpenseId) {
          formData.append("_method", "PUT");

          res = await api.post(`/expenses/${this.editingExpenseId}`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          res = await api.post("/expenses", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        }

        this.closeFormModal();
        this.clearExpenseCache();

        await this.fetchExpenses(this.page);
        await this.fetchExpenseSummary();
      } catch (error) {
        console.error("Failed to save expense:", error);

        if (error.response?.data?.errors) {
          const firstError = Object.values(error.response.data.errors)[0];
          this.formError = Array.isArray(firstError)
            ? firstError[0]
            : "Validation failed.";
        } else {
          this.formError =
            error.response?.data?.message || "Failed to save expense.";
        }
      } finally {
        this.savingForm = false;
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

    categoryBadgeClass(category) {
      const c = (category || "").toLowerCase();

      if (c.includes("salary")) return "badge-category-salary";
      if (c.includes("utility")) return "badge-category-utility";
      if (c.includes("purchase")) return "badge-category-purchase";
      if (c.includes("maintenance")) return "badge-category-maintenance";
      if (c.includes("misc")) return "badge-category-misc";

      return "badge-muted";
    },

    categoryDotClass(category) {
      const c = (category || "").toLowerCase();

      if (c.includes("salary")) return "dot-info";
      if (c.includes("utility")) return "dot-warning";
      if (c.includes("purchase")) return "dot-success";
      if (c.includes("maintenance")) return "dot-purple";
      if (c.includes("misc")) return "dot-muted";

      return "dot-muted";
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
        this.totalRecords = parsed.total || 0;

        // show cached data immediately, no full loading state
        this.loading = false;
      } else {
        this.loading = true;
      }

      try {
        const res = await api.get("/expenses", {
          params: {
            page,
            per_page: this.perPage,
            search: this.searchQuery || undefined,
            category: this.categoryFilter || undefined,
            from_date: this.fromDate || undefined,
            to_date: this.toDate || undefined,
          },
        });

        this.expenses = res.data.data || [];
        this.page = res.data.current_page || 1;
        this.totalPages = res.data.last_page || 1;
        this.totalRecords = res.data.total || 0;

        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
      } catch (error) {
        console.error("Error fetching expenses:", error);
        this.error =
          error.response?.data?.message || "Failed to load expenses.";
      } finally {
        this.loading = false;
      }
    },

    async fetchExpenseSummary() {
      try {
        const res = await api.get("/expenses/summary", {
          params: {
            search: this.searchQuery || undefined,
            category: this.categoryFilter || undefined,
            from_date: this.fromDate || undefined,
            to_date: this.toDate || undefined,
          },
        });

        this.summary = res.data.summary || {
          total_records: 0,
          total_expenses: 0,
          this_month: 0,
        };

        this.monthlyTrend = res.data.monthly_trend || [];
        this.categoryTotals = res.data.category_totals || [];
      } catch (error) {
        console.error("Error fetching expense summary:", error);
      }
    },

    openDeleteModal(expense) {
      this.expenseToDelete = expense;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      if (this.deletingExpense) return;

      this.showDeleteModal = false;
      this.expenseToDelete = null;
    },

    async confirmDeleteExpense() {
      if (!this.expenseToDelete) return;

      this.deletingExpense = true;
      this.error = "";

      try {
        await api.delete(`/expenses/${this.expenseToDelete.id}`);

        this.showDeleteModal = false;
        this.expenseToDelete = null;

        this.closeDetail();

        this.clearExpenseCache();
        await this.fetchExpenses(this.page);
        await this.fetchExpenseSummary();
      } catch (error) {
        console.error("Failed to delete expense:", error);
        this.error =
          error.response?.data?.message || "Failed to delete expense.";
      } finally {
        this.deletingExpense = false;
      }
    },
  },

    watch: {
      searchQuery() {
        clearTimeout(this.searchTimer);

        this.searchTimer = setTimeout(() => {
          this.page = 1;
          this.fetchExpenses(1);
          this.fetchExpenseSummary();
        }, 300);
      }
    }
};
</script>

<style scoped>
.expense-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 340px;
  gap: 18px;
  align-items: start;
}

.stack-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.stack-col .card {
  border-radius: 18px;
  border: 1px solid #eeeeee;
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.04);
}

.stack-col .card-header {
  padding-bottom: 10px;
  border-bottom: 1px solid #f1f1f1;
}

.stack-col .card-title {
  font-size: 13px;
  font-weight: 700;
  color: #222;
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
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #f1f1f1;
}

.category-row:last-child {
  border-bottom: none;
}

.category-row .item-name {
  font-size: 13px;
  font-weight: 500;
  color: #222;
}

.category-row .job-price {
  font-size: 12px;
  font-weight: 500;
  color: #222;
  white-space: nowrap;
}

.category-name-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
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

/* modal */
.modal-card.large {
  width: min(500px, calc(100vw - 32px));
  border-radius: 18px;
}

.modal-header {
  padding: 18px 42px 8px;
}

.modal-header span {
  font-size: 14.5px;
  font-weight: 700;
  color: #222;
}

.modal-body {
  padding: 10px 42px 14px;
}

.modal-detail-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-section {
  border: 1px solid #eeeeee;
  border-radius: 14px;
  padding: 12px 14px;
  background: #fff;
}

.info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 8px 0;
}

.info-row.last {
  padding-bottom: 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.info-item.full {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 10px;
  font-weight: 700;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.info-value {
  font-size: 12px;
  font-weight: 600;
  color: #222;
  line-height: 1.25;
  word-break: break-word;
}

/* buttons */
.modal-actions.split {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 42px 18px;
  border-top: 1px solid #eeeeee;
}



.left-actions {
  display: flex;
  gap: 8px;
}

.modal-actions button {
  height: 34px;
  min-width: 82px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.modal-actions button.primary {
  min-width: 106px;
  background: #111;
  color: #fff;
  border-color: #111;
}

/* category card */
.category-list {
  display: flex;
  flex-direction: column;
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #eeeeee;
}

.category-row:last-child {
  border-bottom: none;
}

.job-price {
  font-size: 13px;
  font-weight: 400;
  color: #222;
}

/* trend single card */
.single-trend-card {
  min-height: 96px;
  border: 1px solid #eeeeee;
  border-radius: 14px;
  background: #fafafa;
  padding: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.single-trend-label {
  font-size: 12px;
  color: #777;
  font-weight: 600;
}

.single-trend-value {
  font-size: 20px;
  color: #111;
  font-weight: 800;
  margin-top: 2px;
}

.single-trend-note {
  font-size: 11.5px;
  color: #999;
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

.modal-actions.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 12px 42px 18px;
  border-top: 1px solid #eeeeee;
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: 1px solid #e5e5e5;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
}

.icon-btn:hover {
  background: #fafafa;
  border-color: #d8d8d8;
}

.receipt-btn {
  color: #444;
}

.muted-dash {
  color: #aaa;
}

.ghost-btn {
  background: #fff;
  border: 1px solid #e5e5e5;
  color: #444;
}

.description-cell {
  max-width: 220px;
  color: #444;
  line-height: 1.35;
  font-size: 12.5px;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.muted-dash {
  color: #aaa;
}

.center {
  text-align: center;
}

.right {
  text-align: right;
}

.description-cell {
  max-width: 220px;
  color: #333;
  font-size: 12.5px;
  line-height: 1.35;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.description-cell.empty {
  color: #8a8a8a;
  font-style: italic;
  font-weight: 400;
}

.money-cell {
  white-space: nowrap;
  font-size: 12.8px;
  font-weight: 400;
  color: #222;
  font-variant-numeric: tabular-nums;
}

.empty-inline {
  font-size: 11.5px;
  color: #aaa;
  font-style: italic;
  white-space: nowrap;
}

/* trend cards */
.trend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border: 1px solid #eeeeee;
  border-radius: 13px;
  background: #fafafa;
}

.trend-label {
  font-size: 13px;
  font-weight: 700;
  color: #222;
}

.trend-sub {
  margin-top: 2px;
  font-size: 11.5px;
  color: #999;
}

.trend-row strong {
  font-size: 13px;
  font-weight: 800;
  color: #222;
  white-space: nowrap;
}

.receipt-chip {
  grid-column: 1 / -1;
  margin-top: 2px;
  padding: 10px 12px;
  border: 1px solid #eeeeee;
  border-radius: 13px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.receipt-chip-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.receipt-chip-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  fill: none;
  stroke: #777;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.receipt-chip-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #222;
  line-height: 1.2;
}

.receipt-chip-sub {
  margin-top: 2px;
  font-size: 11.5px;
  color: #888;
  line-height: 1.2;
}

.receipt-chip-action {
  height: 30px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #e3e3e3;
  background: #fff;
  color: #333;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
}

.receipt-chip-action:hover {
  background: #f7f7f6;
}

</style> 