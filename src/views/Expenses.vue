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
            <span class="page-chip">{{ expenses.length }} shown</span>
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

      <div
        class="expense-grid"
        :class="{ 'expense-grid-staff': currentUser?.role !== 'admin' }"
      >
        <Card>
          <template #header>
            
            <div>
              <span class="card-title">Expenses</span>
              <div class="card-subtitle">Click a row to view details, edit, or manage receipts.</div>
            </div>
            

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

        <div
          v-if="currentUser?.role === 'admin'"
          class="stack-col"
        >
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
            <div class="modal-header detail-modal-header">
              <div>
                <div class="detail-modal-title-row">Expense Detail</div>
                <p class="detail-modal-subtitle">Loading expense information...</p>
              </div>

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
            <div class="modal-header detail-modal-header">
              <div>
                <div class="detail-modal-title-row">
                  <div class="detail-modal-title-row">
                    <span>Expense Detail</span>
                    <span class="badge" :class="categoryBadgeClass(activeExpense.category)">
                      {{ activeExpense.category || "Uncategorised" }}
                    </span>
                  </div>
                </div>

                <p class="detail-modal-subtitle">
                  Expense details, receipt status, and description.
                </p>
              </div>

              <button class="btn btn-sm btn-ghost" @click="closeDetail">✕</button>
            </div>

            <div class="modal-body modal-detail-body">
              <div class="detail-summary-grid">
                <div class="detail-summary-cell">
                  <span>Amount</span>
                  <strong>RM {{ formatMoney(activeExpense.amount) }}</strong>
                </div>

                <div class="detail-summary-cell">
                  <span>Date</span>
                  <strong>{{ formatDate(activeExpense.expense_date) }}</strong>
                </div>

                <div class="detail-summary-cell">
                  <span>Category</span>
                  <strong>{{ activeExpense.category || "-" }}</strong>
                </div>

                <div class="detail-summary-cell">
                  <span>Receipt</span>
                  <strong>{{ activeExpense.receipt_file ? "Uploaded" : "No receipt" }}</strong>
                </div>
              </div>

              <div class="detail-section-card">
                <div class="detail-section-title">Description</div>
                <p class="detail-description">
                  {{ activeExpense.description || "No description provided." }}
                </p>
              </div>
            </div>

     <div class="modal-footer detail-action-footer">
      <div class="detail-action-left">
        <button
          type="button"
          class="btn btn-secondary btn-pill"
          @click="openFormModal(activeExpense)"
        >
          Edit
        </button>

        <button
          type="button"
          class="btn btn-primary btn-pill"
          :disabled="!activeExpense.receipt_file"
          @click="viewReceipt(activeExpense)"
        >
          View Receipt
        </button>
      </div>

      <button
        type="button"
        class="btn btn-danger-light btn-pill"
        @click="openDeleteModal(activeExpense)"
      >
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
          class="modal"
          @click.self="closeDeleteModal"
        >
          <div class="modal-card danger-confirm-card">
            <div class="danger-confirm-body">
              <div class="danger-confirm-icon">!</div>

              <div class="danger-confirm-title">Delete expense?</div>

              <div class="danger-confirm-message">
                Are you sure you want to delete this
                <strong>{{ expenseToDelete?.category || "expense" }}</strong>
                record? This action cannot be undone.
              </div>
            </div>

            <div class="danger-confirm-footer">
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
            <div class="modal-card form-dialog-card">
              <div class="form-dialog-header">
                <div>
                  <div class="form-dialog-title">
                    {{ editingExpenseId ? "Edit Expense" : "Add Expense" }}
                  </div>
                  <p class="form-dialog-subtitle">
                    {{ editingExpenseId ? "Update expense record and receipt." : "Record a workshop operating expense." }}
                  </p>
                </div>

                <button type="button" class="btn btn-sm btn-ghost" @click="closeFormModal">
                  ✕
                </button>
              </div>

              <div class="form-dialog-body">
                <div class="form-dialog-section">
                  <div class="form-dialog-section-title">Expense Information</div>

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

                    <div
                      v-if="editingExpenseId && form.existing_receipt"
                      class="receipt-chip improved"
                    >
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

              <div class="form-dialog-footer">
                <button
                  type="button"
                  class="btn btn-secondary btn-pill"
                  :disabled="savingForm"
                  @click="closeFormModal"
                >
                  Cancel
                </button>

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
      perPage: 10,
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
      return this.expenses || [];
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

    openDetail(expense) {
      this.error = "";
      this.detailLoading = false;
      this.activeExpense = { ...expense };
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
    },

    clearFilters() {
      this.fromDate = "";
      this.toDate = "";
      this.categoryFilter = "";
      this.searchQuery = "";
      this.page = 1;

      this.fetchExpenses(1);
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
        const paginator = parsed.expenses || {};

        this.expenses = paginator.data || [];
        this.page = paginator.current_page || 1;
        this.totalPages = paginator.last_page || 1;
        this.totalRecords = paginator.total || 0;

        this.summary = parsed.summary || {
          total_records: 0,
          total_expenses: 0,
          this_month: 0,
        };

        this.monthlyTrend = parsed.monthly_trend || [];
        this.categoryTotals = parsed.category_totals || [];

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

        const paginator = res.data.expenses || {};

        this.expenses = paginator.data || [];
        this.page = paginator.current_page || 1;
        this.totalPages = paginator.last_page || 1;
        this.totalRecords = paginator.total || 0;

        this.summary = res.data.summary || {
          total_records: 0,
          total_expenses: 0,
          this_month: 0,
        };

        this.monthlyTrend = res.data.monthly_trend || [];
        this.categoryTotals = res.data.category_totals || [];

        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
      } catch (error) {
        console.error("Error fetching expenses:", error);
        this.error =
          error.response?.data?.message || "Failed to load expenses.";
      } finally {
        this.loading = false;
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
        }, 300);
      }
    }
};
</script>

<style scoped>
/* ================================
   EXPENSES
================================ */

.expense-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 340px;
  gap: 18px;
  align-items: start;
}

.expense-grid-staff {
  grid-template-columns: minmax(0, 1fr);
}

.stack-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-subtitle {
  margin-top: 4px;
  font-size: 12.2px;
  color: #8a96a8;
  font-weight: 500;
}

/* ================================
   TABLE CELLS
================================ */

.description-cell {
  max-width: 240px;
  color: #334155;
  font-size: 12.5px;
  line-height: 1.35;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.description-cell.empty {
  color: #8a96a8;
  font-style: normal;
}

.money-cell {
  font-size: 12.8px;
  font-weight: 760;
  color: #0f172a;
  white-space: nowrap;
}

/* ================================
   MONTHLY TREND
================================ */

.single-trend-card {
  min-height: 92px;
  border: 1px solid #dfe5ee;
  border-radius: 14px;
  background: #fbfcfe;
  padding: 15px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
}

.single-trend-label {
  font-size: 12.5px;
  color: #64748b;
  font-weight: 750;
}

.single-trend-value {
  margin-top: 2px;
  font-size: 18px;
  color: #0f172a;
  font-weight: 850;
}

.single-trend-note {
  font-size: 11.5px;
  color: #8a96a8;
}

.trend-list {
  border: 1px solid #dfe5ee;
  border-radius: 14px;
  background: #fbfcfe;
  overflow: hidden;
}

.trend-row {
  min-height: 58px;
  padding: 13px 14px;
  border-bottom: 1px solid #e5eaf1;
  background: transparent;
  display: flex;
  border-radius: 0;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.trend-row:last-child {
  border-bottom: none;
}

.trend-label {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}

.trend-sub {
  margin-top: 3px;
  font-size: 11.8px;
  font-weight: 500;
  color: #8a96a8;
}

.trend-row strong {
  font-size: 13.2px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
}

.trend-month {
  display: block;
  font-size: 12.8px;
  font-weight: 800;
  color: #0f172a;
}

.summary-row small {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  font-weight: 500;
  color: #8a96a8;
}

/* ================================
   CATEGORY LIST
================================ */

.category-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #dfe5ee;
  border-radius: 14px;
  background: #fbfcfe;
  overflow: hidden;
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-height: 42px;
  padding: 10px 14px;
  border-bottom: 1px solid #e5eaf1;
}

.category-row:last-child {
  border-bottom: none;
}

.category-name-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* ================================
   RECEIPT CHIP
================================ */

.receipt-chip {
  grid-column: 1 / -1;
  margin-top: 2px;
  padding: 11px 13px;
  border: 1px solid #dfe5ee;
  border-radius: 13px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.receipt-chip.improved {
  background: #f8fafc;
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
  stroke: #64748b;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.receipt-chip-title {
  font-size: 12.5px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.2;
}

.receipt-chip-sub {
  margin-top: 3px;
  font-size: 11.5px;
  color: #8a96a8;
  line-height: 1.2;
}

.receipt-chip-action {
  min-height: 30px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid #dfe5ee;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
}

.receipt-chip-action:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

/* ================================
   RESPONSIVE
================================ */

@media (max-width: 1100px) {
  .expense-grid {
    grid-template-columns: 1fr;
  }

  .filters-bar {
    flex-wrap: wrap;
  }
}

@media (max-width: 720px) {
  .expense-kpi-grid {
    grid-template-columns: 1fr;
  }

  .receipt-chip {
    align-items: flex-start;
    flex-direction: column;
  }

  .receipt-chip-action {
    width: 100%;
  }
}
</style> 