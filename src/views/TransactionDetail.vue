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

      <!-- TOP BAR -->
      <div class="topbar">
        <div class="topbar-left">
          <router-link to="/transactions" class="back-link">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Transactions
          </router-link>
          <h1 class="page-title">{{ transaction?.document_number || 'Transaction detail' }}</h1>
        </div>
        <div class="topbar-right">
          <button
            v-if="transaction?.status === 'quotation'"
            class="btn-primary"
            :disabled="actionLoading"
            @click="confirmQuotation"
          >
            {{ actionLoading ? 'Processing...' : 'Confirm to invoice' }}
          </button>
          <button
            v-if="transaction?.status === 'invoice' && balanceDue > 0"
            class="btn-primary"
            :disabled="actionLoading"
            @click="openPaymentModal"
          >
            Add payment
          </button>
        </div>
      </div>

      <!-- LOADING -->
      <div v-if="loading" class="card-bare">
        <div class="empty-state">Loading transaction...</div>
      </div>

      <template v-else-if="transaction">

        <!-- DETAIL GRID -->
        <div class="detail-grid">

          <!-- LEFT: summary info -->
          <Card class="detail-card">
            <template #header>
              <span class="card-title">Summary</span>
              <span class="status-badge" :class="transaction.status">{{ transaction.status }}</span>
            </template>
            <div class="info-grid">
              <div class="info-block">
                <div class="info-label">Document no.</div>
                <div class="info-value">{{ transaction.document_number || '-' }}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Created</div>
                <div class="info-value">{{ formatDateTime(transaction.created_at) }}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Customer</div>
                <div class="info-value">{{ transaction.customer?.name || '-' }}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Phone</div>
                <div class="info-value">{{ transaction.customer?.phone || '-' }}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Plate</div>
                <div class="info-value">{{ transaction.vehicle?.license_plate || '-' }}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Make / model</div>
                <div class="info-value">{{ transaction.vehicle?.make || '-' }} {{ transaction.vehicle?.model || '' }}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Year</div>
                <div class="info-value">{{ transaction.vehicle?.year || '-' }}</div>
              </div>
              <div class="info-block">
                <div class="info-label">Notes</div>
                <div class="info-value">{{ transaction.notes || '-' }}</div>
              </div>
            </div>
          </Card>

          <!-- RIGHT: actions + totals -->
          <div class="detail-right-col">
            <Card class="detail-card">
              <template #header>
                <span class="card-title">Actions</span>
              </template>
              <div class="actions-col">
                <button v-if="transaction.status === 'quotation'" class="btn-outline" @click="previewDocument('quotation')">Preview quotation</button>
                <button v-if="transaction.status === 'invoice'"   class="btn-outline" @click="previewDocument('invoice')">Preview invoice</button>
                <button v-if="transaction.status === 'receipt'"   class="btn-outline" @click="previewDocument('receipt')">Preview receipt</button>
                <button v-if="transaction.status === 'receipt'"   class="btn-outline" @click="downloadDocument('receipt')">Download receipt</button>
                <button class="btn-wa" @click="openWhatsApp(transaction)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  Send via WhatsApp
                </button>
                <router-link v-if="transaction.status === 'quotation'" :to="`/transactions/${transaction.id}/edit`" class="btn-outline link-btn">Edit transaction</router-link>
                <button v-if="transaction.status === 'quotation'" class="btn-primary" :disabled="actionLoading" @click="confirmQuotation">
                  {{ actionLoading ? 'Processing...' : 'Confirm to invoice' }}
                </button>
                <button v-if="transaction.status === 'invoice'" class="btn-primary" :disabled="actionLoading" @click="openPaymentModal">
                  Add payment
                </button>
              </div>
            </Card>

            <Card class="detail-card totals-card">
              <template #header>
                <span class="card-title">Totals</span>
              </template>
              <div class="totals-rows">
                <div class="totals-row">
                  <span>Subtotal</span>
                  <span>RM {{ formatMoney(transaction.total_amount) }}</span>
                </div>
                <div class="totals-row">
                  <span>Discount</span>
                  <span>RM {{ formatMoney(transaction.discount_amount || 0) }}</span>
                </div>
                <div class="totals-row">
                  <span>Total paid</span>
                  <span>RM {{ formatMoney(totalPaid) }}</span>
                </div>
                <div class="totals-row totals-row--total">
                  <span>Balance due</span>
                  <span>RM {{ formatMoney(balanceDue) }}</span>
                </div>
              </div>

              <div v-if="transaction.payments && transaction.payments.length" class="payment-history">
                <div class="payment-history-title">Payment history</div>
                <div v-for="payment in transaction.payments" :key="payment.id" class="payment-row">
                  <div>
                    <div class="payment-method">{{ payment.payment_method || '-' }}</div>
                    <div class="payment-meta">
                      {{ formatDateTime(payment.payment_date) }}
                      <span v-if="payment.payment_reference"> · Ref: {{ payment.payment_reference }}</span>
                    </div>
                  </div>
                  <strong class="payment-amount">RM {{ formatMoney(payment.amount_paid) }}</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- ITEMS -->
        <Card class="detail-card items-card">
          <template #header>
            <span class="card-title">Line items</span>
            <span class="items-count">{{ transaction.items?.length || 0 }} item{{ (transaction.items?.length || 0) !== 1 ? 's' : '' }}</span>
          </template>

          <div v-if="!transaction.items || transaction.items.length === 0" class="empty-state">No items for this transaction.</div>
          <table v-else class="items-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Qty</th>
                <th class="col-right">Unit price</th>
                <th class="col-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in transaction.items" :key="item.id">
                <td>
                  <div class="cell-primary">
                    {{ item.item_type === 'service' ? (item.service_name || 'Service') : partDisplayName(item) }}
                  </div>
                  <div v-if="item.note" class="cell-sub">{{ item.note }}</div>
                </td>
                <td>
                  <span class="type-badge" :class="item.item_type">{{ item.item_type || '-' }}</span>
                </td>
                <td>{{ item.quantity || '-' }}</td>
                <td class="col-right">RM {{ formatMoney(item.selling_price) }}</td>
                <td class="col-right cell-primary">RM {{ formatMoney(item.total_price) }}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        <div v-if="error" class="page-error">{{ error }}</div>
      </template>

      <div v-else class="card-bare">
        <div class="empty-state">Transaction not found.</div>
      </div>

      <!-- PDF PREVIEW MODAL -->
      <Teleport to="body">
        <div v-if="pdfPreviewUrl" class="modal-overlay" @click.self="closePdfPreview">
          <div class="pdf-container">
            <div class="pdf-topbar">
              <div class="pdf-title">
                {{ currentDocType ? currentDocType.charAt(0).toUpperCase() + currentDocType.slice(1) : 'Document preview' }}
              </div>
              <div class="pdf-actions">
                <button class="btn-outline" type="button" @click="closePdfPreview">Close</button>
                <button class="btn-primary" type="button" @click="downloadDocument(currentDocType)">Download</button>
              </div>
            </div>
            <iframe :src="pdfPreviewUrl"></iframe>
          </div>
        </div>
      </Teleport>

      <!-- PAYMENT MODAL -->
      <Teleport to="body">
        <div v-if="showPaymentModal" class="modal-overlay" @click.self="closePaymentModal">
          <div class="modal-card">
            <div class="modal-header">
              <span>Record payment</span>
              <button type="button" class="modal-close" @click="closePaymentModal">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-grid">
                <div class="field">
                  <label>Amount paid</label>
                  <input v-model.number="paymentForm.amount_paid" type="number" min="0.01" step="0.01" />
                </div>
                <div class="field">
                  <label>Payment method</label>
                  <select v-model="paymentForm.payment_method">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank transfer</option>
                    <option value="qr">QR</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div class="field">
                  <label>Reference</label>
                  <input v-model="paymentForm.payment_reference" type="text" placeholder="Optional" />
                </div>
                <div class="field">
                  <label>Payment date</label>
                  <input v-model="paymentForm.payment_date" type="date" />
                </div>
              </div>
              <div v-if="paymentFormError" class="page-error" style="margin-top: 12px;">{{ paymentFormError }}</div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-outline" @click="closePaymentModal">Cancel</button>
              <button type="button" class="btn-primary" :disabled="actionLoading" @click="submitPayment">
                {{ actionLoading ? 'Processing...' : 'Confirm payment' }}
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
/* ── PAGE BASE ── */
.dash {
  display: flex;
  min-height: 100vh;
  background: #f6f6f4;
}

.main {
  flex: 1;
  min-width: 0;
  padding: 28px 32px 40px;
}

/* ── TOPBAR ── */
.topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 500;
  color: #999;
  text-decoration: none;
  margin-bottom: 5px;
  transition: color 0.13s;
}

.back-link:hover { color: #555; }

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.03em;
  margin: 0;
}

.topbar-right { display: flex; gap: 8px; align-items: center; }

/* ── BUTTONS ── */
.btn-primary {
  height: 36px;
  padding: 0 16px;
  border-radius: 9px;
  background: #B41C1C;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 0.13s;
}

.btn-primary:hover { background: #991818; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-outline {
  height: 36px;
  padding: 0 14px;
  border-radius: 9px;
  border: 0.5px solid #d8d8d4;
  background: #fff;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: background 0.13s, border-color 0.13s;
}

.btn-outline:hover { background: #f5f5f2; border-color: #c8c8c4; }

.btn-wa {
  height: 36px;
  padding: 0 14px;
  border-radius: 9px;
  background: #25D366;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: background 0.13s;
}

.btn-wa:hover { background: #1ebe5a; }
.link-btn { text-decoration: none; }

/* ── LAYOUT ── */
.detail-grid {
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 16px;
  margin-bottom: 16px;
  align-items: start;
}

.detail-right-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── CARDS ── */
.detail-card {
  background: #fff;
  border: 0.5px solid #e4e4e0;
  border-radius: 14px;
  overflow: hidden;
}

.card-bare {
  background: #fff;
  border: 0.5px solid #e4e4e0;
  border-radius: 14px;
  padding: 24px;
}

.items-card { margin-bottom: 0; }

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

/* ── STATUS BADGE ── */
.status-badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.quotation { background: #FAEEDA; color: #854F0B; }
.status-badge.invoice   { background: #E6F1FB; color: #185FA5; }
.status-badge.receipt   { background: #EAF3DE; color: #3B6D11; }

/* ── INFO GRID ── */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.info-block {
  padding: 10px 12px;
  background: #fafaf8;
  border: 0.5px solid #eeeee9;
  border-radius: 9px;
}

.info-label {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #bbb;
  margin-bottom: 4px;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #111;
  line-height: 1.4;
}

/* ── ACTIONS COL ── */
.actions-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions-col .btn-outline,
.actions-col .btn-primary,
.actions-col .btn-wa,
.actions-col .link-btn {
  width: 100%;
  justify-content: center;
}

/* ── TOTALS ── */
.totals-rows {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  padding: 8px 0;
  border-bottom: 0.5px solid #f0f0ec;
}

.totals-row:last-of-type { border-bottom: none; }

.totals-row--total {
  padding-top: 10px;
  border-top: 1px solid #e4e4e0;
  border-bottom: none;
  font-weight: 600;
  color: #111;
  font-size: 14px;
  margin-top: 4px;
}

/* ── PAYMENT HISTORY ── */
.payment-history {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 0.5px solid #eeeee9;
}

.payment-history-title {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #bbb;
  margin-bottom: 10px;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 0.5px solid #f0f0ec;
}

.payment-row:last-child { border-bottom: none; }

.payment-method {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  text-transform: capitalize;
}

.payment-meta {
  margin-top: 2px;
  font-size: 11px;
  color: #aaa;
}

.payment-amount {
  font-size: 13px;
  font-weight: 600;
  color: #111;
  white-space: nowrap;
}

/* ── ITEMS TABLE ── */
.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.items-table th {
  padding: 9px 16px;
  text-align: left;
  font-size: 10.5px;
  font-weight: 600;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  border-bottom: 0.5px solid #eeeee9;
  background: #fafaf8;
}

.items-table td {
  padding: 12px 16px;
  border-bottom: 0.5px solid #f2f2ee;
  vertical-align: middle;
  color: #333;
}

.items-table tbody tr:last-child td { border-bottom: none; }
.items-table tbody tr:hover td { background: #fafaf8; }

.col-right { text-align: right; }

.cell-primary { font-weight: 500; color: #111; }
.cell-sub { margin-top: 3px; font-size: 11px; color: #aaa; }

.items-count {
  font-size: 12px;
  color: #aaa;
  font-weight: 400;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 500;
  text-transform: capitalize;
}

.type-badge.service { background: #E6F1FB; color: #185FA5; }
.type-badge.part    { background: #EAF3DE; color: #3B6D11; }

.empty-state {
  padding: 20px 0 8px;
  font-size: 13px;
  color: #aaa;
  font-style: italic;
}

/* ── ERROR ── */
.page-error {
  margin-top: 12px;
  font-size: 12px;
  color: #A32D2D;
  background: #FCEBEB;
  border: 0.5px solid #F7C1C1;
  border-radius: 8px;
  padding: 10px 14px;
}

/* ── PDF MODAL ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(10, 10, 10, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.pdf-container {
  width: min(95vw, 1320px);
  height: min(92vh, 960px);
  background: #fff;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pdf-topbar {
  height: 54px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 0.5px solid #eeeee9;
  flex-shrink: 0;
}

.pdf-title {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}

.pdf-actions { display: flex; gap: 8px; }

.pdf-container iframe {
  flex: 1;
  width: 100%;
  border: none;
  background: #f5f5f2;
}

/* ── PAYMENT MODAL ── */
.modal-card {
  width: min(500px, 100%);
  background: #fff;
  border-radius: 14px;
  border: 0.5px solid #e4e4e0;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 0.5px solid #eeeee9;
  font-size: 14px;
  font-weight: 600;
  color: #111;
}

.modal-close {
  width: 28px;
  height: 28px;
  border: 0.5px solid #ddd;
  border-radius: 8px;
  background: #fff;
  color: #777;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.13s;
}

.modal-close:hover { background: #f5f5f2; }

.modal-body { padding: 18px 20px; }

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field { display: flex; flex-direction: column; gap: 6px; }

.field label {
  font-size: 11.5px;
  font-weight: 600;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.field input,
.field select {
  height: 40px;
  border: 0.5px solid #d8d8d4;
  border-radius: 9px;
  padding: 0 12px;
  background: #fafaf8;
  color: #111;
  font-size: 13px;
  outline: none;
  transition: border-color 0.13s;
  font: inherit;
}

.field input:focus,
.field select:focus {
  border-color: #B41C1C;
  background: #fff;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 14px 20px 20px;
  border-top: 0.5px solid #eeeee9;
}

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .detail-grid { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 768px) {
  .main { padding: 20px 16px 40px; }
  .topbar { flex-direction: column; align-items: flex-start; }
  .info-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .modal-actions { grid-template-columns: 1fr; }
  .modal-overlay { padding: 16px; align-items: flex-end; }
  .modal-card { border-radius: 14px 14px 0 0; width: 100%; }
}
</style>

