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
          <div class="page-title">
            {{ transaction?.document_number || "Transaction Detail" }}
          </div>
          <div class="page-subtitle">
            Review quotation, invoice, receipt, and transaction items
          </div>
        </div>

        <div class="page-actions">
          <router-link to="/transactions" class="btn btn-secondary btn-pill link-btn">
            Back
          </router-link>

          <button
            v-if="transaction?.status === 'quotation'"
            class="btn btn-primary btn-pill"
            :disabled="actionLoading"
            @click="confirmQuotation"
          >
            {{ actionLoading ? "Processing..." : "Confirm to Invoice" }}
          </button>

          <button
            v-if="transaction?.status === 'invoice' && balanceDue > 0"
            class="btn btn-primary btn-pill"
            :disabled="actionLoading"
            @click="openPaymentModal"
          >
            Add Payment
          </button>
        </div>
      </div>

      <div v-if="loading" class="card">
        <div class="empty-state">Loading transaction detail...</div>
      </div>

      <template v-else-if="transaction">
        <div class="detail-grid">
          <Card>
            <template #header>
              <span class="card-title">Transaction Summary</span>
              <span :class="['badge', `badge-${transaction.status}`]">
                {{ transaction.status }}
              </span>
            </template>

            <div class="summary-grid">
              <div class="info-block">
                <div class="info-label">Document No.</div>
                <div class="info-value">{{ transaction.document_number || "-" }}</div>
              </div>

              <div class="info-block">
                <div class="info-label">Created At</div>
                <div class="info-value">{{ formatDateTime(transaction.created_at) }}</div>
              </div>

              <div class="info-block">
                <div class="info-label">Customer</div>
                <div class="info-value">{{ transaction.customer?.name || "-" }}</div>
              </div>

              <div class="info-block">
                <div class="info-label">Phone</div>
                <div class="info-value">{{ transaction.customer?.phone || "-" }}</div>
              </div>

              <div class="info-block">
                <div class="info-label">Vehicle</div>
                <div class="info-value">
                  {{ transaction.vehicle?.license_plate || "-" }}
                </div>
              </div>

              <div class="info-block">
                <div class="info-label">Make / Model</div>
                <div class="info-value">
                  {{ transaction.vehicle?.make || "-" }}
                  {{ transaction.vehicle?.model || "" }}
                </div>
              </div>

              <div class="info-block">
                <div class="info-label">Year</div>
                <div class="info-value">{{ transaction.vehicle?.year || "-" }}</div>
              </div>

              <div class="info-block">
                <div class="info-label">Notes</div>
                <div class="info-value">
                  {{ transaction.notes || "-" }}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <template #header>
              <span class="card-title">Actions</span>
            </template>

            <div class="actions-panel">
                <button
                class="btn btn-secondary btn-pill"
                @click="previewDocument('quotation')"
                v-if="transaction.status === 'quotation'"
                >
                Preview Quotation
                </button>

                <button
                class="btn btn-secondary btn-pill"
                @click="previewDocument('invoice')"
                v-if="transaction.status === 'invoice'"
                >
                Preview Invoice
                </button>

                <button
                class="btn btn-secondary btn-pill"
                @click="previewDocument('receipt')"
                v-if="transaction.status === 'receipt'"
                >
                Preview Receipt
                </button>
                <button
                class="btn btn-secondary btn-pill"
                @click="downloadDocument('receipt')"
                v-if="transaction.status === 'receipt'"
                >
                Download Receipt
                </button>
              <button class="btn btn-secondary btn-pill" @click="openWhatsApp(transaction)">
                WhatsApp Customer
              </button>

              <router-link
                v-if="transaction.status === 'quotation'"
                :to="`/transactions/${transaction.id}/edit`"
                class="btn btn-secondary btn-pill"
                >
                Edit Transaction
                </router-link>

              <button
                v-if="transaction.status === 'quotation'"
                class="btn btn-primary btn-pill"
                :disabled="actionLoading"
                @click="confirmQuotation"
              >
                {{ actionLoading ? "Processing..." : "Confirm to Invoice" }}
              </button>

              <button
                v-if="transaction.status === 'invoice'"
                class="btn btn-primary btn-pill"
                :disabled="actionLoading"
                @click="openPaymentModal"
              >
                Add Payment
              </button>
            </div>

            <div class="summary-box">
              <div class="summary-box-row">
                <span>Subtotal</span>
                <span>RM {{ formatMoney(transaction.total_amount) }}</span>
              </div>

              <div class="summary-box-row">
                <span>Discount</span>
                <span>RM {{ formatMoney(transaction.discount_amount || 0) }}</span>
              </div>

              <div class="summary-box-row">
                <span>Total Paid</span>
                <span>RM {{ formatMoney(totalPaid) }}</span>
              </div>

              <div class="summary-box-row">
                <span>Balance Due</span>
                <span>RM {{ formatMoney(balanceDue) }}</span>
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
                    <div class="payment-method">{{ payment.payment_method || "-" }}</div>
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
            </div>
          </Card>
        </div>

        <Card>
          <template #header>
            <span class="card-title">Items</span>
            <span class="card-link">{{ transaction.items?.length || 0 }} item(s)</span>
          </template>

          <div v-if="!transaction.items || transaction.items.length === 0" class="empty-state">
            No items found for this transaction.
          </div>

          <div v-else class="items-list">
            <div
              v-for="item in transaction.items"
              :key="item.id"
              class="item-row"
            >
              <div class="item-left">
                <div class="item-name">
                  {{
                    item.item_type === "service"
                      ? item.service_name || "Service"
                      : partDisplayName(item)
                  }}
                </div>

                <div class="item-meta">
                  Type: {{ item.item_type || "-" }}
                  <span v-if="item.quantity"> · Qty: {{ item.quantity }}</span>
                  <span v-if="item.note"> · {{ item.note }}</span>
                </div>
              </div>

              <div class="item-right">
                <div class="item-price">
                  RM {{ formatMoney(item.total_price) }}
                </div>
                <div class="item-unit">
                  Unit: RM {{ formatMoney(item.selling_price) }}
                </div>
              </div>
            </div>
          </div>
        </Card>

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
                {{ currentDocType ? currentDocType.charAt(0).toUpperCase() + currentDocType.slice(1) : "Document Preview" }}
              </div>

              <div class="pdf-actions">
                <button class="pdf-close-btn" type="button" @click="closePdfPreview">
                  Close
                </button>

                <button class="btn btn-primary btn-pill" type="button" @click="downloadDocument(currentDocType)">
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
              <button type="button" class="btn btn-sm btn-ghost" @click="closePaymentModal">✕</button>
            </div>

            <div class="modal-body">
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
                  <input
                    v-model="paymentForm.payment_date"
                    type="date"
                  />
                </div>
              </div>

              <div v-if="paymentFormError" class="page-error" style="margin-top:12px;">
                {{ paymentFormError }}
              </div>
            </div>

            <div class="modal-footer split">
              <button type="button" class="btn btn-secondary btn-pill" @click="closePaymentModal">Cancel</button>
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
.detail-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
  margin-bottom: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.info-block {
  padding: 10px 12px;
  background: #fafaf9;
  border: 1px solid #ececea;
  border-radius: 10px;
}

.info-label {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.info-value {
  font-size: 12px;
  color: #111;
  font-weight: 500;
  line-height: 1.4;
}

.actions-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 12px;
  border: 1px solid #ececea;
  border-radius: 10px;
  background: #fafaf9;
}

.item-left {
  min-width: 0;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.item-meta {
  margin-top: 4px;
  font-size: 11px;
  color: #888;
  line-height: 1.4;
}

.item-right {
  text-align: right;
  white-space: nowrap;
}

.item-price {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.item-unit {
  margin-top: 4px;
  font-size: 11px;
  color: #888;
}

.page-error {
  margin-top: 12px;
  font-size: 12px;
  color: #e53935;
  background: #fff1f1;
  border: 1px solid #ffd6d6;
  border-radius: 8px;
  padding: 10px 12px;
}

.pdf-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  width: 100dvw;
  height: 100dvh;
  background: rgba(15, 15, 15, 0.45);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  z-index: 99999;
}

.pdf-container {
  width: min(95vw, 1400px);
  height: min(92vh, 1000px);
  background: #fff;
  border-radius: 16px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.pdf-container iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
  background: #f5f5f5;
}

/*
.pdf-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pdf-title {
  font-size: 14px;
  font-weight: 700;
  color: #171717;
}

.pdf-actions {
  display: flex;
  gap: 8px;
}

.payment-history {
  margin-top: 12px;
  border-top: 1px solid #eeeeea;
  padding-top: 10px;
}
  */

.pdf-topbar {
  height: 58px;
  padding: 0 16px 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #eeeeea;
  background: #fff;
}

.pdf-title {
  font-size: 14px;
  font-weight: 800;
  color: #111;
}

.pdf-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.pdf-close-btn {
  height: 38px;
  padding: 0 18px;
  border: 1px solid #deded9;
  border-radius: 12px;
  background: #ffffff;
  color: #444;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
}

.pdf-close-btn:hover {
  background: #f5f5f2;
  border-color: #d2d2cc;
}

.pdf-close-btn:active {
  transform: scale(0.97);
}

.payment-title {
  font-size: 11px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 8px;
  font-weight: 600;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f3f0;
}

.payment-row:last-child {
  border-bottom: none;
}

.payment-method {
  font-size: 12px;
  font-weight: 600;
  color: #111;
  text-transform: capitalize;
}

.payment-meta {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(17, 17, 17, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.modal-card {
  width: min(460px, 100%);
  max-height: calc(100vh - 48px);
  background: #ffffff;
  border: 1px solid #eeeeea;
  border-radius: 16px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 14px 20px 20px;
  border-top: 1px solid #f0f0ed;
  background: #ffffff;
}

.modal-actions button {
  height: 42px;
  border-radius: 10px;
  border: 1px solid #deded9;
  background: #ffffff;
  color: #333333;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.modal-actions button.primary {
  border-color: #111111;
  background: #111111;
  color: #ffffff;
}

.modal-actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .modal {
    padding: 16px;
    align-items: flex-end;
  }

  .modal-card.large {
    width: 100%;
    border-radius: 16px 16px 0 0;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .detail-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>