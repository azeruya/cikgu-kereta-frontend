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
            <div class="page-title">
              {{ transaction?.document_number || "Transaction Detail" }}
            </div>

            <span
              v-if="transaction"
              :class="['badge', `badge-${transaction.status}`]"
            >
              {{ transaction.status }}
            </span>
          </div>

          <!--
          
          <div class="page-subtitle">
            Review customer details, documents, payments, and transaction items
          </div>
          -->
        </div>

        <div class="page-actions">
          <router-link to="/transactions" class="btn btn-secondary btn-pill link-btn">
            Back
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="card">
        <div class="empty-state">Loading transaction detail...</div>
      </div>

      <template v-else-if="transaction">
        <div class="transaction-detail-layout">
          <div class="transaction-detail-main">
            <!-- OVERVIEW -->
            <Card class="workflow-card">
              <template #header>
                <div class="section-heading no-index">
                  <div>
                    <span class="card-title">Transaction Overview</span>
                    <p class="section-caption">
                      Customer, vehicle, document, and service request details.
                    </p>
                  </div>
                </div>
              </template>

              <div class="overview-panel">
                <div class="overview-cell important">
                  <span>Document No.</span>
                  <strong>{{ transaction.document_number || "-" }}</strong>
                </div>

                <div class="overview-cell">
                  <span>Created At</span>
                  <div class="overview-value">{{ formatDateTime(transaction.created_at) }}</div>
                </div>

                <div class="overview-cell">
                  <span>Customer</span>
                  <div class="overview-value">{{ transaction.customer?.name || "-" }}</div>
                </div>

                <div class="overview-cell">
                  <span>Phone</span>
                  <div class="overview-value">{{ transaction.customer?.phone || "-" }}</div>
                </div>

                <div class="overview-cell">
                  <span>Vehicle</span>
                  <div class="overview-value">{{ transaction.vehicle?.license_plate || "-" }}</div>
                </div>

                <div class="overview-cell">
                  <span>Make / Model</span>
                  <div class="overview-value">
                    {{ transaction.vehicle?.make || "-" }}
                    {{ transaction.vehicle?.model || "" }}
                  </div>
                </div>

                <div class="overview-cell">
                  <span>Year</span>
                  <div class="overview-value">{{ transaction.vehicle?.year || "-" }}</div>
                </div>

                <div class="overview-cell notes-cell">
                  <span>Notes</span>
                  <div class="overview-value">{{ transaction.notes || "-" }}</div>
                </div>
              </div>
            </Card>

            <!-- ITEMS -->
            <Card class="workflow-card">
              <template #header>
                <div class="section-heading no-index">
                  <div>
                    <span class="card-title">Transaction Items</span>
                    <p class="section-caption">
                      Parts and services included in this transaction.
                    </p>
                  </div>
                </div>

                <span class="section-count">
                  {{ transaction.items?.length || 0 }} item(s)
                </span>
              </template>

              <div v-if="!transaction.items || transaction.items.length === 0" class="setup-panel compact">
                <div class="setup-icon">
                  <svg viewBox="0 0 24 24" class="setup-svg">
                    <path d="M8 6h13" />
                    <path d="M8 12h13" />
                    <path d="M8 18h13" />
                    <path d="M3 6h.01" />
                    <path d="M3 12h.01" />
                    <path d="M3 18h.01" />
                  </svg>
                </div>

                <div class="setup-content">
                  <strong>No items found</strong>
                  <p>This transaction does not have any part or service item.</p>
                </div>
              </div>

              <div v-else class="detail-item-list">
                <div
                  v-for="item in transaction.items"
                  :key="item.id"
                  class="detail-item-card"
                >
                  <div class="detail-item-left">
                    <span
                      class="type-badge"
                      :class="item.item_type === 'service' ? 'warning' : 'info'"
                    >
                      {{ item.item_type === "service" ? "Service" : "Part" }}
                    </span>

                    <div class="detail-item-copy">
                      <div class="detail-item-name">
                        {{
                          item.item_type === "service"
                            ? item.service_name || "Service"
                            : partDisplayName(item)
                        }}
                      </div>

                      <div class="detail-item-meta">
                        Qty: {{ item.quantity || 1 }}
                        <span v-if="item.note"> · {{ item.note }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="detail-item-right">
                    <strong>RM {{ formatMoney(item.total_price) }}</strong>
                    <span>Unit: RM {{ formatMoney(item.selling_price) }}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <!-- ACTION CENTER -->
          <aside class="transaction-detail-side">
            <Card class="action-center-card">
              <template #header>
                <span class="card-title">Action Center</span>
              </template>

              <div class="primary-action-block">
                <button
                  v-if="transaction.status === 'quotation'"
                  class="btn btn-primary btn-pill"
                  :disabled="actionLoading"
                  @click="confirmQuotation"
                >
                  {{ actionLoading ? "Processing..." : "Confirm to Invoice" }}
                </button>

                <button
                  v-if="transaction.status === 'invoice' && balanceDue > 0"
                  class="btn btn-primary btn-pill"
                  :disabled="actionLoading"
                  @click="openPaymentModal"
                >
                  Add Payment
                </button>

                <div
                  v-if="transaction.status === 'receipt' || balanceDue <= 0"
                  class="completed-panel"
                >
                  <span>✓</span>
                  <div>
                    <strong>Payment completed</strong>
                    <p>No outstanding balance for this transaction.</p>
                  </div>
                </div>
              </div>

              <div class="action-list">
                <button
                  v-if="transaction.status === 'quotation'"
                  class="btn btn-secondary btn-pill"
                  @click="previewDocument('quotation')"
                >
                  Preview Quotation
                </button>

                <button
                  v-if="transaction.status === 'invoice'"
                  class="btn btn-secondary btn-pill"
                  @click="previewDocument('invoice')"
                >
                  Preview Invoice
                </button>

                <button
                  v-if="transaction.status === 'receipt'"
                  class="btn btn-secondary btn-pill"
                  @click="previewDocument('receipt')"
                >
                  Preview Receipt
                </button>

                <button
                  v-if="transaction.status === 'receipt'"
                  class="btn btn-secondary btn-pill"
                  @click="downloadDocument('receipt')"
                >
                  Download Receipt
                </button>

                <button
                  class="btn btn-secondary btn-pill"
                  @click="openWhatsApp(transaction)"
                >
                  WhatsApp Customer
                </button>

                <router-link
                  v-if="transaction.status === 'quotation'"
                  :to="`/transactions/${transaction.id}/edit`"
                  class="btn btn-secondary btn-pill"
                >
                  Edit Transaction
                </router-link>
              </div>

              <div class="side-summary-box transaction-money-box">
                <div class="side-summary-row">
                  <span>Subtotal</span>
                  <strong>RM {{ formatMoney(transaction.total_amount) }}</strong>
                </div>

                <div class="side-summary-row">
                  <span>Discount</span>
                  <strong>RM {{ formatMoney(transaction.discount_amount || 0) }}</strong>
                </div>

                <div class="side-summary-row">
                  <span>Total Paid</span>
                  <strong>RM {{ formatMoney(totalPaid) }}</strong>
                </div>

                <div
                  class="side-summary-row total"
                  :class="{ danger: balanceDue > 0, success: balanceDue <= 0 }"
                >
                  <span>Balance Due</span>
                  <strong>RM {{ formatMoney(balanceDue) }}</strong>
                </div>
              </div>

              <div
                v-if="transaction.payments && transaction.payments.length"
                class="payment-history"
              >
                <div class="payment-title">Payment History</div>

                <div
                  v-for="payment in transaction.payments"
                  :key="payment.id"
                  class="payment-row"
                >
                  <div>
                    <div class="payment-method">
                      {{ payment.payment_method || "-" }}
                    </div>
                    <div class="payment-meta">
                      {{ formatDateTime(payment.payment_date) }}
                      <span v-if="payment.payment_reference">
                        · Ref: {{ payment.payment_reference }}
                      </span>
                    </div>
                  </div>

                  <strong>RM {{ formatMoney(payment.amount_paid) }}</strong>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        <div v-if="error" class="page-error">
          {{ error }}
        </div>
      </template>

      <div v-else class="card">
        <div class="empty-state">Transaction not found.</div>
      </div>

      <!-- PDF Preview Modal -->
      <Teleport to="body">
        <div v-if="pdfPreviewUrl" class="pdf-modal" @click.self="closePdfPreview">
          <div class="pdf-container">
            <div class="pdf-topbar">
              <div class="pdf-title">
                {{
                  currentDocType
                    ? currentDocType.charAt(0).toUpperCase() + currentDocType.slice(1)
                    : "Document Preview"
                }}
              </div>

              <div class="pdf-actions">
                <button
                  class="btn btn-secondary btn-pill"
                  type="button"
                  @click="closePdfPreview"
                >
                  Close
                </button>

                <button
                  class="btn btn-primary btn-pill"
                  type="button"
                  @click="downloadDocument(currentDocType)"
                >
                  Download
                </button>
              </div>
            </div>

            <iframe :src="pdfPreviewUrl"></iframe>
          </div>
        </div>
      </Teleport>

      <!-- Payment Modal -->
      <Teleport to="body">
        <div v-if="showPaymentModal" class="modal" @click.self="closePaymentModal">
          <div class="modal-card large">
            <div class="modal-header">
              <span>Record Payment</span>
              <button
                type="button"
                class="btn btn-sm btn-ghost"
                @click="closePaymentModal"
              >
                ✕
              </button>
            </div>

            <div class="modal-body">
              <div class="payment-due-panel">
                <span>Amount due</span>
                <strong>RM {{ formatMoney(balanceDue) }}</strong>
              </div>

              <div class="form-grid">
                <div class="form-field">
                  <label>Amount Paid</label>
                  <input
                    v-model.number="paymentForm.amount_paid"
                    type="number"
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div class="form-field">
                  <label>Payment Method</label>
                  <select v-model="paymentForm.payment_method">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="qr">QR</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div class="form-field">
                  <label>Payment Reference</label>
                  <input
                    v-model="paymentForm.payment_reference"
                    type="text"
                    placeholder="Optional reference"
                  />
                </div>

                <div class="form-field">
                  <label>Payment Date</label>
                  <input v-model="paymentForm.payment_date" type="date" />
                </div>
              </div>

              <div v-if="paymentFormError" class="page-error" style="margin-top:12px;">
                {{ paymentFormError }}
              </div>
            </div>

            <div class="modal-footer form-actions">
              <button
                type="button"
                class="btn btn-secondary btn-pill"
                @click="closePaymentModal"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary btn-pill"
                :disabled="actionLoading"
                @click="submitPayment"
              >
                {{ actionLoading ? "Processing..." : "Confirm Payment" }}
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
import Card from "../components/Card.vue";
import api from "../services/api";

export default {
  components: {
    Sidebar,
    Card,
  },

  data() {
    return {
      collapsed: localStorage.getItem("sidebar-collapsed") === "true",
      loading: false,
      actionLoading: false,
      error: "",
      transaction: null,
      pdfPreviewUrl: null,
      currentDocType: null,
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

    transactionId() {
      return this.$route.params.id;
    },

    totalAfterDiscount() {
      if (!this.transaction) return 0;

      return (
        Number(this.transaction.total_amount || 0) -
        Number(this.transaction.discount_amount || 0)
      );
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
  },

  mounted() {
    this.fetchTransaction();
  },

  beforeUnmount() {
    if (this.pdfPreviewUrl) {
        URL.revokeObjectURL(this.pdfPreviewUrl);
    }
    },

  methods: {
    async fetchTransaction() {
      this.loading = true;
      this.error = "";

      try {
        const res = await api.get(`/transactions/${this.transactionId}`);
        this.transaction = res.data;
      } catch (error) {
        console.error("Error loading transaction detail:", error);
        this.error =
          error.response?.data?.message || "Failed to load transaction detail.";
      } finally {
        this.loading = false;
      }
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

    clearInventoryCache() {
    Object.keys(sessionStorage)
        .filter((key) => key.startsWith("inventory-"))
        .forEach((key) => sessionStorage.removeItem(key));
    },

    async confirmQuotation() {
    if (!this.transaction) return;

    this.actionLoading = true;
    this.error = "";

    try {
        await api.post(`/transactions/${this.transaction.id}/confirm`);

        if (this.clearTransactionCache) {
        this.clearTransactionCache();
        }

        this.clearInventoryCache();

        await this.fetchTransaction();
    } catch (error) {
        console.error("Error confirming quotation:", error);
        this.error =
        error.response?.data?.message || "Failed to confirm quotation.";
    } finally {
        this.actionLoading = false;
    }
    },

    async markPaid() {
      if (!this.transaction) return;

      this.actionLoading = true;
      this.error = "";

      try {
        await api.post(`/transactions/${this.transaction.id}/pay`);
        await this.fetchTransaction();
      } catch (error) {
        console.error("Error marking paid:", error);
        this.error =
          error.response?.data?.message || "Failed to mark transaction as paid.";
      } finally {
        this.actionLoading = false;
      }
    },

    async previewDocument(type) {
    try {
        this.error = "";
        this.currentDocType = type;

        const res = await api.get(
        `/transactions/${this.transaction.id}/documents/${type}`,
        {
            responseType: "blob",
        }
        );

        if (this.pdfPreviewUrl) {
        URL.revokeObjectURL(this.pdfPreviewUrl);
        }

        const blob = new Blob([res.data], { type: "application/pdf" });
        this.pdfPreviewUrl = URL.createObjectURL(blob);
    } catch (error) {
        console.error("Error previewing document:", error);
        this.error =
        error.response?.data?.message || "Failed to preview PDF document.";
    }
    },

    async downloadDocument(type) {
    try {
        this.error = "";

        const res = await api.get(
        `/transactions/${this.transaction.id}/documents/${type}`,
        {
            responseType: "blob",
        }
        );

        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${type}-${this.transaction.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading document:", error);
        this.error =
        error.response?.data?.message || "Failed to download PDF document.";
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

    closePdfPreview() {
    if (this.pdfPreviewUrl) {
        URL.revokeObjectURL(this.pdfPreviewUrl);
    }
    this.pdfPreviewUrl = null;
    this.currentDocType = null;
    },

    partDisplayName(item) {
      const name = item.part?.name || "Part";
      const variant = item.part?.variant ? ` — ${item.part.variant}` : "";
      return `${name}${variant}`;
    },

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    formatDateTime(value) {
      if (!value) return "-";

      return new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    },

    openPaymentModal() {
    this.paymentFormError = "";
    this.paymentForm = {
        amount_paid: Number(this.balanceDue || 0),
        payment_method: "cash",
        payment_reference: "",
        payment_date: new Date().toISOString().slice(0, 10),
    };
    this.showPaymentModal = true;
    },

    closePaymentModal() {
    this.showPaymentModal = false;
    this.paymentFormError = "";
    },

    async submitPayment() {
    if (!this.transaction) return;

    this.actionLoading = true;
    this.paymentFormError = "";
    this.error = "";

    try {
        await api.post(`/transactions/${this.transaction.id}/pay`, {
        amount_paid: Number(this.paymentForm.amount_paid || 0),
        payment_method: this.paymentForm.payment_method,
        payment_reference: this.paymentForm.payment_reference || null,
        payment_date: this.paymentForm.payment_date || null,
        });

        this.closePaymentModal();

        if (this.clearTransactionCache) {
        this.clearTransactionCache();
        }

        this.clearInventoryCache();

        await this.fetchTransaction();
    } catch (error) {
        console.error("Error marking paid:", error);

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
  },

  watch: {
    "$route.params.id"() {
      this.fetchTransaction();
    }
  }
};
</script>

<style scoped>
/* ================================
   TRANSACTION DETAIL
================================ */

.transaction-detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 22px;
  align-items: start;
  width: 100%;
  max-width: 1380px;
}

.transaction-detail-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.transaction-detail-side {
  position: sticky;
  top: 24px;
  align-self: start;
}

.action-center-card {
  min-height: auto;
}

/* ================================
   OVERVIEW
================================ */

.overview-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid #dfe5ee;
  border-radius: 14px;
  background: #f8fafc;
  overflow: hidden;
}

.overview-cell {
  min-height: 62px;
  padding: 12px 14px;
  border-right: 1px solid #e5eaf1;
  border-bottom: 1px solid #e5eaf1;
  background: #ffffff;
}

.overview-cell:nth-child(2n) {
  border-right: none;
}

.overview-cell:nth-last-child(-n + 2) {
  border-bottom: none;
}

.overview-cell span {
  display: block;
  margin-bottom: 5px;
  font-size: 10.5px;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: #8a96a8;
}

.overview-cell strong,
.overview-value {
  display: block;
  font-size: 12px;
  font-weight: 450;
  color: #0f172a;
  line-height: 1.35;
  word-break: break-word;
}

.overview-cell.important strong {
  font-weight: 820;
  letter-spacing: -0.01em;
}

.overview-note {
  font-weight: 620;
  color: #1e293b;
}

.notes-cell strong {
  font-weight: 650;
  color: #1e293b;
}

/* ================================
   ACTION CENTER
================================ */

.primary-action-block {
  margin-bottom: 11px;
}

.primary-action-block > .btn {
  width: 100%;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.action-list .btn,
.primary-action-block > .btn {
  min-height: 38px;
  font-size: 12.5px;
}

.completed-panel {
  padding: 13px 14px;
  border: 1px solid #d7f0df;
  border-radius: 14px;
  background: #f0fdf4;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.completed-panel > span {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 900;
  flex-shrink: 0;
}

.completed-panel strong {
  display: block;
  font-size: 12.8px;
  font-weight: 850;
  color: #166534;
}

.completed-panel p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #4b8060;
  line-height: 1.35;
}

.transaction-money-box {
  margin-top: 4px;
}

.side-summary-row.danger strong {
  color: #b42318;
}

.side-summary-row.success strong {
  color: #15803d;
}

/* ================================
   ITEMS
================================ */

.detail-item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item-card {
  min-height: 68px;
  padding: 13px 14px;
  border: 1px solid #e1e7ef;
  border-radius: 14px;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
}

.detail-item-card:hover {
  border-color: #d4dce8;
}

.detail-item-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.detail-item-copy {
  min-width: 0;
}

.detail-item-name {
  font-size: 13.5px;
  font-weight: 780;
  color: #0f172a;
  line-height: 1.25;
}

.detail-item-meta {
  margin-top: 4px;
  font-size: 11.6px;
  color: #8a96a8;
  line-height: 1.35;
}

.detail-item-right {
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
}

.detail-item-right strong {
  display: block;
  font-size: 13.5px;
  font-weight: 850;
  color: #0f172a;
}

.detail-item-right span {
  display: block;
  margin-top: 4px;
  font-size: 11.5px;
  color: #8a96a8;
}

/* ================================
   PAYMENT HISTORY
================================ */

.payment-history {
  margin-top: 14px;
  border-top: 1px solid #e5eaf1;
  padding-top: 12px;
}

.payment-title {
  margin-bottom: 7px;
  font-size: 10.5px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  font-weight: 850;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #edf1f6;
}

.payment-row:last-child {
  border-bottom: none;
}

.payment-method {
  font-size: 12.5px;
  font-weight: 800;
  color: #0f172a;
  text-transform: capitalize;
}

.payment-meta {
  font-size: 11.5px;
  color: #8a96a8;
  margin-top: 2px;
  line-height: 1.35;
}

.payment-row strong {
  font-size: 12.8px;
  font-weight: 850;
  color: #0f172a;
  white-space: nowrap;
}

/* ================================
   PAYMENT MODAL
================================ */

.payment-due-panel {
  margin-bottom: 14px;
  padding: 13px 14px;
  border-radius: 14px;
  border: 1px solid #dfe5ee;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.payment-due-panel span {
  font-size: 12.5px;
  color: #64748b;
  font-weight: 700;
}

.payment-due-panel strong {
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
}

/* ================================
   PDF MODAL
================================ */

.pdf-modal {
  position: fixed;
  inset: 0;
  width: 100dvw;
  height: 100dvh;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  z-index: 99999;
}

.pdf-container {
  width: min(95vw, 1400px);
  height: min(92vh, 1000px);
  background: #ffffff;
  border: 1px solid #dfe5ee;
  border-radius: 18px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 26px 80px rgba(15, 23, 42, 0.24);
}

.pdf-topbar {
  height: 58px;
  padding: 0 16px 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #edf1f6;
  background: #ffffff;
}

.pdf-title {
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
}

.pdf-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.pdf-container iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
  background: #f8fafc;
}

/* ================================
   RESPONSIVE
================================ */

@media (max-width: 1150px) {
  .transaction-detail-layout {
    grid-template-columns: 1fr;
  }

  .transaction-detail-side {
    position: static;
  }
}

@media (max-width: 700px) {
  .overview-panel {
    grid-template-columns: 1fr;
  }

  .overview-cell,
  .overview-cell:nth-child(2n),
  .overview-cell:nth-last-child(-n + 2) {
    border-right: none;
    border-bottom: 1px solid #e5eaf1;
  }

  .overview-cell:last-child {
    border-bottom: none;
  }

  .detail-item-card,
  .detail-item-left {
    flex-direction: column;
  }

  .detail-item-right {
    width: 100%;
    text-align: left;
  }

  .pdf-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>