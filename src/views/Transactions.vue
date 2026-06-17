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
    <div class="top-bar">
        <div class="page-intro">
        <div class="page-title-row">
            <div class="page-title">Transactions</div>
            <span class="page-chip">
            {{
                activeTab === "all"
                ? `${transactions.length} records`
                : `${transactions.length} ${activeTab}`
            }}
            </span>
        </div>

        <div class="page-date">
            Track customer billing and service progress
        </div>
        </div>

        <div class="top-right">
        <input
            class="search"
            v-model.trim="searchQuery"
            placeholder="Search doc no / customer / plate..."
        />
        <router-link to="/transactions/new" class="pill-btn primary link-btn">
            + New Transaction
        </router-link>
        </div>
    </div>

    <div class="tabs">
        <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab', { active: activeTab === tab.value }]"
        @click="changeTab(tab.value)"
        >
        {{ tab.label }}
        </button>
    </div>

      <div class="card">
        <div v-if="loading" class="empty-state">Loading transactions...</div>

        <template v-else>
          <table class="table" v-if="filteredTransactions.length > 0">
            <thead>
              <tr>
                <th>Doc No.</th>
                <th>Customer</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="trx in filteredTransactions" :key="trx.id">
                <td>{{ trx.document_number || "-" }}</td>

                <td>
                  <div>{{ trx.customer?.name || "-" }}</div>
                  <small>{{ trx.customer?.phone || "-" }}</small>
                </td>

                <td>
                  <div>{{ trx.vehicle?.license_plate || "-" }}</div>
                  <small>
                    {{ trx.vehicle?.make || "" }} {{ trx.vehicle?.model || "" }}
                  </small>
                </td>

                <td>
                  <span :class="['status-badge', trx.status]">
                    {{ trx.status }}
                  </span>
                </td>

                <td>RM {{ formatMoney(trx.total_amount) }}</td>
                <td>{{ formatDate(trx.created_at) }}</td>

                <td class="right">
                  <div class="action-icon-group" @click.stop>
                    <!-- View -->
                    <router-link
                      class="icon-action"
                      :to="`/transactions/${trx.id}`"
                      title="View transaction"
                    >
                      <svg viewBox="0 0 24 24" class="icon-svg">
                        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </router-link>

                    <!-- WhatsApp -->
                    <button
                      class="icon-action"
                      title="Send WhatsApp"
                      @click="openWhatsApp(trx)"
                    >
                      <svg viewBox="0 0 24 24" class="icon-svg">
                        <path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L4 20l1.2-4.2A8.5 8.5 0 1 1 21 11.5z" />
                        <path d="M9.5 8.5c.3 2.5 1.7 4.3 4 5.4" />
                        <path d="M14 14l1.5-1" />
                      </svg>
                    </button>

                    <!-- Confirm quotation -->
                    <button
                      v-if="trx.status === 'quotation'"
                      class="icon-action confirm"
                      :disabled="actionLoadingId === trx.id"
                      title="Confirm quotation"
                      @click="openConfirmQuotationModal(trx)"
                    >
                      <span v-if="actionLoadingId === trx.id" class="icon-loading">...</span>
                      <svg v-else viewBox="0 0 24 24" class="icon-svg">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>

                    <!-- Add payment -->
                    <button
                      v-if="trx.status === 'invoice'"
                      class="icon-action payment"
                      :disabled="actionLoadingId === trx.id"
                      title="Add payment"
                      @click="openPaymentModal(trx)"
                    >
                      <span v-if="actionLoadingId === trx.id" class="icon-loading">...</span>
                      <svg v-else viewBox="0 0 24 24" class="icon-svg">
                        <path d="M3 7h18v10H3z" />
                        <path d="M3 10h18" />
                        <path d="M12 14h5" />
                        <path d="M7 14h1" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="empty-state">
            No transactions found.
          </div>

          <div class="pagination" v-if="totalPages > 1">
            <button @click="prevPage" :disabled="page === 1">←</button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="page === totalPages">→</button>
          </div>
        </template>
      </div>

      <Teleport to="body">
        <div v-if="showPaymentModal" class="modal" @click.self="closePaymentModal">
          <div class="modal-card large form-modal-card">
            <div class="modal-header">
              <span>Record Payment</span>
              <button type="button" class="mini-btn btn btn-sm btn-ghost" @click="closePaymentModal">✕</button>
            </div>

            <div class="modal-body form-modal-body">
              <div class="form-section">
                <div class="section-title">
                  {{ paymentTransactionDocNo }}
                </div>

                <div class="payment-summary-box">
                  <span>Amount due</span>
                  <strong>RM {{ formatMoney(paymentTransactionTotal) }}</strong>
                </div>

                <div class="form-grid payment-form-grid">
                  <div class="field">
                    <label>Amount Paid</label>
                    <input
                      v-model.number="paymentForm.amount_paid"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div class="field">
                    <label>Payment Method</label>
                    <select v-model="paymentForm.payment_method">
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Card</option>
                      <option value="ewallet">E-wallet</option>
                    </select>
                  </div>

                  <div class="field">
                    <label>Payment Reference</label>
                    <input
                      v-model="paymentForm.payment_reference"
                      type="text"
                      placeholder="Optional reference"
                    />
                  </div>

                  <div class="field">
                    <label>Payment Date</label>
                    <input v-model="paymentForm.payment_date" type="date" />
                  </div>
                </div>
              </div>

              <div v-if="paymentFormError" class="page-error" style="margin-top:12px;">
                {{ paymentFormError }}
              </div>
            </div>

            <div class="modal-actions form-actions">
              <button type="button" @click="closePaymentModal">Cancel</button>
              <button
                type="button"
                class="primary btn-primary"
                :disabled="actionLoadingId === paymentTransactionId"
                @click="submitPayment"
              >
                {{ actionLoadingId === paymentTransactionId ? "Saving..." : "Confirm Payment" }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <Teleport to="body">
        <div
          v-if="showConfirmQuotationModal"
          class="delete-modal-overlay"
          @click.self="closeConfirmQuotationModal"
        >
          <div class="confirm-modal-card">
            <div class="confirm-icon">✓</div>

            <div class="delete-title">Confirm quotation?</div>

            <div class="delete-message">
              This will convert
              <strong>{{ quotationToConfirm?.document_number || "this quotation" }}</strong>
              for
              <strong>{{ quotationToConfirm?.customer?.name || "this customer" }}</strong>
              into an invoice.
            </div>

            <div class="delete-actions">
              <button
                type="button"
                class="delete-cancel"
                :disabled="actionLoadingId === quotationToConfirm?.id"
                @click="closeConfirmQuotationModal"
              >
                Cancel
              </button>

              <button
                type="button"
                class="confirm-action"
                :disabled="actionLoadingId === quotationToConfirm?.id"
                @click="submitConfirmQuotation"
              >
                {{ actionLoadingId === quotationToConfirm?.id ? "Confirming..." : "Confirm" }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";
import api from "../services/api";

export default {
  components: { Sidebar },

  data() {
    return {
      collapsed: localStorage.getItem("sidebar-collapsed") === "true",
      loading: false,
      actionLoadingId: null,
      error: "",

      tabs: [
        { label: "All", value: "all" },
        { label: "Quotations", value: "quotation" },
        { label: "Invoices", value: "invoice" },
        { label: "Receipts", value: "receipt" }
      ],

      activeTab: "all",
      searchQuery: "",
      transactions: [],
      page: 1,
      totalPages: 1,
      paymentTransactionDocNo: "",
      paymentTransactionId: null,
      paymentTransactionTotal: 0,
      actionLoading: false,
      showConfirmQuotationModal: false,
      quotationToConfirm: null,
      showPaymentModal: false,
      paymentFormError: "",
      paymentForm: {
        amount_paid: "",
        payment_method: "cash",
        payment_reference: "",
        payment_date: new Date().toISOString().slice(0, 10),
        },
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

    totalPaid() {
      return (this.transaction?.payments || []).reduce(
        (sum, payment) => sum + Number(payment.amount_paid || 0),
        0
      );
    },

    balanceDue() {
      return Math.max(this.totalAfterDiscount - this.totalPaid, 0);
    },

    isFullyPaid() {
      return this.balanceDue <= 0;
    },

    filteredTransactions() {
      let list = this.transactions || [];

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter((trx) =>
          (trx.document_number || "").toLowerCase().includes(q) ||
          (trx.customer?.name || "").toLowerCase().includes(q) ||
          (trx.vehicle?.license_plate || "").toLowerCase().includes(q)
        );
      }

      return list;
    },

    
  },

  mounted() {
    this.fetchTransactions();
  },

  methods: {
    getCacheKey(page = 1) {
      return `transactions-${this.activeTab}-page-${page}`;
    },

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

    clearTransactionCache() {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith("transactions-"))
        .forEach((key) => sessionStorage.removeItem(key));
    },

    async fetchTransactions(page = 1) {
      const cacheKey = this.getCacheKey(page);
      const cached = sessionStorage.getItem(cacheKey);

      this.error = "";

      if (cached) {
        const parsed = JSON.parse(cached);
        this.transactions = parsed.data || [];
        this.page = parsed.current_page || 1;
        this.totalPages = parsed.last_page || 1;
      } else {
        this.loading = true;
      }

      try {
        const params = {
          page,
          per_page: 8,
        };

        if (this.activeTab !== "all") {
          params.status = this.activeTab;
        }

        const res = await api.get("/transactions", { params });

        this.transactions = res.data.data || [];
        this.page = res.data.current_page || 1;
        this.totalPages = res.data.last_page || 1;

        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
      } catch (error) {
        console.error("Error fetching transactions:", error);
        this.error =
          error.response?.data?.message || "Failed to load transactions.";
      } finally {
        this.loading = false;
      }
    },

    changeTab(tab) {
      this.activeTab = tab;
      this.page = 1;
      this.fetchTransactions(1);
    },

    clearInventoryCache() {
    Object.keys(sessionStorage)
        .filter((key) => key.startsWith("inventory-"))
        .forEach((key) => sessionStorage.removeItem(key));
    },

    nextPage() {
      if (this.page < this.totalPages) {
        this.fetchTransactions(this.page + 1);
      }
    },

    prevPage() {
      if (this.page > 1) {
        this.fetchTransactions(this.page - 1);
      }
    },

    openConfirmQuotationModal(trx) {
      this.quotationToConfirm = trx;
      this.showConfirmQuotationModal = true;
    },

    closeConfirmQuotationModal() {
      if (this.actionLoadingId) return;

      this.showConfirmQuotationModal = false;
      this.quotationToConfirm = null;
    },

    async submitConfirmQuotation() {
      if (!this.quotationToConfirm) return;

      const id = this.quotationToConfirm.id;

      this.actionLoadingId = id;
      this.error = "";

      try {
        await api.post(`/transactions/${id}/confirm`);

        this.clearTransactionCache();
        this.clearInventoryCache();

        this.showConfirmQuotationModal = false;
        this.quotationToConfirm = null;

        await this.fetchTransactions(this.page);
      } catch (error) {
        console.error("Error confirming quotation:", error);
        this.error =
          error.response?.data?.message || "Failed to confirm quotation.";
      } finally {
        this.actionLoadingId = null;
      }
    },

    formatWhatsappNumber(phone) {
      if (!phone) return "";

      let cleaned = String(phone).trim();

      // Remove spaces, dashes, brackets, plus
      cleaned = cleaned.replace(/[\s\-()+]/g, "");

      // 0060193804822 -> 60193804822
      if (/^00601\d{8,9}$/.test(cleaned)) {
        cleaned = cleaned.slice(2);
      }

      // Local Malaysia: 0193804822 -> 60193804822
      if (/^01\d{8,9}$/.test(cleaned)) {
        cleaned = "6" + cleaned;
      }

      // Excel removed leading 0: 193804822 -> 60193804822
      if (/^1\d{8,9}$/.test(cleaned)) {
        cleaned = "60" + cleaned;
      }

      return cleaned;
    },

    openWhatsApp(trx) {
      const customerName = trx.customer?.name || "Customer";
      const plate = trx.vehicle?.license_plate || "-";
      const docNo = trx.document_number || "-";
      const amount = this.formatMoney(
        Number(trx.total_amount || 0) - Number(trx.discount_amount || 0)
      );

      let docLabel = "document";
      if (trx.status === "quotation") docLabel = "quotation";
      if (trx.status === "invoice") docLabel = "invoice";
      if (trx.status === "receipt") docLabel = "receipt";

      const msg =
        `Hi ${customerName}, here is your ${docLabel} for vehicle ${plate}. ` +
        `Document No: ${docNo}. Total: RM ${amount}.`;

      const phone = this.formatWhatsappNumber(trx.customer?.phone);
      if (!phone) {
        alert("Customer phone number not available.");
        return;
      }

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    },

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    formatDate(value) {
      if (!value) return "-";
      return new Date(value).toLocaleDateString("en-GB");
    },

    openPaymentModal(trx) {
      this.paymentFormError = "";
      this.paymentTransactionId = trx.id;
      this.paymentTransactionDocNo = trx.document_number || `#${trx.id}`;

      const totalAmount = Number(trx.total_amount || 0);
      const discountAmount = Number(trx.discount_amount || 0);
      const totalPaid = Number(trx.total_paid || 0);

      const balanceDue = Math.max(totalAmount - discountAmount - totalPaid, 0);

      this.paymentTransactionTotal = balanceDue;

      this.paymentForm = {
        amount_paid: balanceDue,
        payment_method: "cash",
        payment_reference: "",
        payment_date: new Date().toISOString().slice(0, 10),
      };

      this.showPaymentModal = true;
    },

    closePaymentModal() {
      if (this.actionLoadingId === this.paymentTransactionId) return;

      this.showPaymentModal = false;
      this.paymentFormError = "";
      this.paymentTransactionId = null;
      this.paymentTransactionDocNo = "";
      this.paymentTransactionTotal = 0;

      this.paymentForm = {
        amount_paid: "",
        payment_method: "cash",
        payment_reference: "",
        payment_date: new Date().toISOString().slice(0, 10),
      };
    },

    async submitPayment() {
    if (!this.paymentTransactionId) return;

    this.actionLoading = true;
    this.paymentFormError = "";
    this.error = "";

    try {
        await api.post(`/transactions/${this.paymentTransactionId}/pay`, {
        amount_paid: Number(this.paymentForm.amount_paid || 0),
        payment_method: this.paymentForm.payment_method,
        payment_reference: this.paymentForm.payment_reference || null,
        payment_date: this.paymentForm.payment_date || null,
        });

        this.closePaymentModal();
        this.clearTransactionCache();
        await this.fetchTransactions(this.page);
    } catch (error) {
        console.error("Error recording payment:", error);

        if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        this.paymentFormError = Array.isArray(firstError)
            ? firstError[0]
            : "Validation failed.";
        } else {
        this.paymentFormError =
            error.response?.data?.message || "Failed to record payment.";
        }
    } finally {
        this.actionLoading = false;
    }
    },
  }
};
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: capitalize;
  border: 1px solid #ddd;
}

.status-badge.quotation {
  background: #fff8e1;
  color: #8a5a00;
}

.status-badge.invoice {
  background: #eef4ff;
  color: #1565c0;
}

.status-badge.receipt {
  background: #f0faf0;
  color: #2e7d32;
}

.mini-btn.primary {
  background: #111;
  color: #fff;
  border-color: #111;
}

.mini-btn.success {
  background: #2e7d32;
  color: #fff;
  border-color: #2e7d32;
}

.jobs-section {
  margin-top: 14px;
}

.section-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.job-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.item-name {
  font-weight: 500;
  color: #111;
}

.job-price {
  font-weight: 600;
  white-space: nowrap;
}

.summary-box {
  margin-top: 14px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #555;
  margin-bottom: 6px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-row.total {
  padding-top: 8px;
  border-top: 1px solid #ececec;
  color: #111;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  font-size: 12px;
  color: #555;
}

.detail-notes {
  margin-top: 12px;
  font-size: 12px;
  color: #555;
}

.link-btn {
  text-decoration: none;
}

/* action buttons */
.right {
  text-align: right;
}

.action-icon-group {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 7px;
}

.icon-action {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  border: 1px solid #e6e6e6;
  background: #fff;
  color: #6f6f6f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
}

.icon-action:hover {
  color: #333;
  background: #f9f9f9;
  border-color: #d8d8d8;
}

.icon-action:active {
  transform: scale(0.96);
}

.icon-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.icon-action.confirm {
  color: #5f6f4f;
  border-color: #dfe9d8;
}

.icon-action.confirm:hover {
  color: #287a3e;
  background: #f3faf4;
  border-color: #cce5d2;
}

.icon-action.payment {
  color: #4f6f58;
  border-color: #d7eadc;
}

.icon-action.payment:hover {
  color: #1f7a3a;
  background: #f3faf4;
  border-color: #cce5d2;
}

.icon-svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-loading {
  font-size: 11px;
  font-weight: 700;
  color: #777;
}

/* payment modal */
.form-modal-card {
  width: min(560px, calc(100vw - 32px));
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 38px 10px;
}

.modal-header span {
  font-size: 15px;
  font-weight: 700;
  color: #222;
}

.modal-body {
  padding: 10px 38px 16px;
}

.form-section {
  border: 1px solid #eeeeee;
  border-radius: 15px;
  padding: 16px;
  background: #fff;
}

.section-title {
  font-size: 10.5px;
  font-weight: 700;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 12px;
}

.payment-summary-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  border-radius: 13px;
  background: #fafafa;
  border: 1px solid #eeeeee;
}

.payment-summary-box span {
  font-size: 12.5px;
  color: #777;
}

.payment-summary-box strong {
  font-size: 14px;
  font-weight: 800;
  color: #222;
}

.payment-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 11px;
  font-weight: 700;
  color: #777;
}

.field input,
.field select {
  width: 100%;
  height: 40px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  font-size: 13px;
  color: #222;
  outline: none;
  padding: 0 13px;
  box-sizing: border-box;
}

.field input:focus,
.field select:focus {
  border-color: #111;
}

.modal-actions.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 14px 38px 20px;
  border-top: 1px solid #eeeeee;
}

.modal-actions.form-actions button {
  height: 36px;
  min-width: 96px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}

.modal-actions.form-actions button.primary {
  min-width: 135px;
  background: #111;
  color: #fff;
  border-color: #111;
}

/*confirm quotation modal */
.confirm-modal-card {
  width: min(370px, calc(100vw - 32px));
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
  text-align: center;
}

.confirm-icon {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #f3faf4;
  color: #287a3e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 18px;
  font-weight: 800;
}

.confirm-action {
  flex: 1;
  height: 38px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid #111;
  background: #111;
  color: #fff;
}

.confirm-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(1.5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.confirm-modal-card {
  width: min(370px, calc(100vw - 32px));
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
  text-align: center;
}

.confirm-icon {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #f3faf4;
  color: #287a3e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 18px;
  font-weight: 800;
}

.delete-title {
  font-size: 16px;
  font-weight: 700;
  color: #171717;
  margin-bottom: 8px;
}

.delete-message {
  font-size: 13px;
  line-height: 1.5;
  color: #666;
  margin-bottom: 20px;
}

.delete-message strong {
  color: #222;
}

.delete-actions {
  display: flex;
  gap: 10px;
}

.delete-actions button {
  flex: 1;
  height: 38px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.delete-cancel {
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
}

.confirm-action {
  border: 1px solid #111;
  background: #111;
  color: #fff;
}

.confirm-action:disabled,
.delete-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>