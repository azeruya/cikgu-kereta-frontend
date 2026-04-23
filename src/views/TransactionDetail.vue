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
        <div>
          <div class="page-title">
            {{ transaction?.document_number || "Transaction Detail" }}
          </div>
          <div class="page-date">
            Review quotation, invoice, receipt, and transaction items
          </div>
        </div>

        <div class="top-right">
          <router-link to="/transactions" class="pill-btn link-btn">
            Back
          </router-link>

          <button
            v-if="transaction?.status === 'quotation'"
            class="pill-btn primary"
            :disabled="actionLoading"
            @click="confirmQuotation"
          >
            {{ actionLoading ? "Processing..." : "Confirm to Invoice" }}
          </button>

          <button
            v-if="transaction?.status === 'invoice'"
            class="pill-btn primary"
            :disabled="actionLoading"
            @click="openPaymentModal"
          >
            Mark Paid
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
              <span :class="['status-badge', transaction.status]">
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
                class="pill-btn"
                @click="previewDocument('quotation')"
                v-if="transaction.status === 'quotation'"
                >
                Preview Quotation
                </button>

                <button
                class="pill-btn"
                @click="previewDocument('invoice')"
                v-if="transaction.status === 'invoice'"
                >
                Preview Invoice
                </button>

                <button
                class="pill-btn"
                @click="previewDocument('receipt')"
                v-if="transaction.status === 'receipt'"
                >
                Preview Receipt
                </button>
                <button
                class="pill-btn"
                @click="downloadDocument('receipt')"
                v-if="transaction.status === 'receipt'"
                >
                Download Receipt
                </button>
              <button class="pill-btn" @click="openWhatsApp(transaction)">
                WhatsApp Customer
              </button>

              <router-link
                v-if="transaction.status === 'quotation'"
                :to="`/transactions/${transaction.id}/edit`"
                class="pill-btn"
                >
                Edit Transaction
                </router-link>

              <button
                v-if="transaction.status === 'quotation'"
                class="pill-btn primary"
                :disabled="actionLoading"
                @click="confirmQuotation"
              >
                {{ actionLoading ? "Processing..." : "Confirm to Invoice" }}
              </button>

              <button
                v-if="transaction.status === 'invoice'"
                class="pill-btn primary"
                :disabled="actionLoading"
                @click="openPaymentModal"
              >
                Mark Paid
              </button>
            </div>

            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>RM {{ formatMoney(transaction.total_amount) }}</span>
              </div>

              <div class="summary-row">
                <span>Discount</span>
                <span>RM {{ formatMoney(transaction.discount_amount || 0) }}</span>
              </div>

              <div class="summary-row total">
                <span>Total</span>
                <span>RM {{ formatMoney(totalAfterDiscount) }}</span>
              </div>
              <div v-if="transaction.payments && transaction.payments.length" class="summary-box" style="margin-top:16px;">
                <div class="summary-row">
                    <span>Payment Method</span>
                    <span>{{ transaction.payments[0].payment_method || "-" }}</span>
                </div>
                <div class="summary-row">
                    <span>Amount Paid</span>
                    <span>RM {{ formatMoney(transaction.payments[0].amount_paid) }}</span>
                </div>
                <div class="summary-row">
                    <span>Reference</span>
                    <span>{{ transaction.payments[0].payment_reference || "-" }}</span>
                </div>
                <div class="summary-row">
                    <span>Payment Date</span>
                    <span>{{ formatDateTime(transaction.payments[0].payment_date) }}</span>
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

      <Teleport to="body">
  <div v-if="pdfPreviewUrl" class="pdf-modal" @click.self="closePdfPreview">
    <div class="pdf-container">
      <div class="pdf-topbar">
        <div class="pdf-title">
          {{ currentDocType ? currentDocType.charAt(0).toUpperCase() + currentDocType.slice(1) : "Document Preview" }}
        </div>

        <div class="pdf-actions">
          <button class="mini-btn" @click="closePdfPreview">Close</button>
          <button class="pill-btn primary" @click="downloadDocument(currentDocType)">
            Download
          </button>
        </div>
      </div>

      <iframe :src="pdfPreviewUrl"></iframe>
    </div>
  </div>
</Teleport>

      <Teleport to="body">
        <div v-if="showPaymentModal" class="modal" @click.self="closePaymentModal">
          <div class="modal-card large">
            <div class="modal-header">
              <span>Record Payment</span>
              <button type="button" class="mini-btn" @click="closePaymentModal">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-grid">
                <div class="field">
                  <label>Amount Paid</label>
                  <input
                    v-model.number="paymentForm.amount_paid"
                    type="number"
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div class="field">
                  <label>Payment Method</label>
                  <select v-model="paymentForm.payment_method">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="qr">QR</option>
                    <option value="card">Card</option>
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

            <div class="modal-actions">
              <button type="button" @click="closePaymentModal">Cancel</button>
              <button
                type="button"
                class="primary"
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
      collapsed: false,
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

      menu: [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Expenses", path: "/expenses", icon: "alert" },
        { name: "Reports", path: "/reports", icon: "chart" }
      ]
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

    transactionId() {
      return this.$route.params.id;
    },

    totalAfterDiscount() {
      if (!this.transaction) return 0;

      return (
        Number(this.transaction.total_amount || 0) -
        Number(this.transaction.discount_amount || 0)
      );
    }
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

      const phone = (trx.customer?.phone || "").replace(/[^\d]/g, "");
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
        amount_paid: Number(this.totalAfterDiscount || 0),
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

.summary-box {
  margin-top: 8px;
  padding: 12px;
  background: #fafafa;
  border-radius: 10px;
  border: 1px solid #ececec;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #555;
  margin-bottom: 8px;
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

.link-btn {
  text-decoration: none;
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

@media (max-width: 1100px) {
  .detail-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>