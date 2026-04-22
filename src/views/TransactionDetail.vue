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
            @click="markPaid"
          >
            {{ actionLoading ? "Processing..." : "Mark Paid" }}
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
              <button class="pill-btn" @click="openWhatsApp(transaction)">
                WhatsApp Customer
              </button>

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
                @click="markPaid"
              >
                {{ actionLoading ? "Processing..." : "Mark Paid" }}
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

    async confirmQuotation() {
      if (!this.transaction) return;

      this.actionLoading = true;
      this.error = "";

      try {
        await api.post(`/transactions/${this.transaction.id}/confirm`);
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
    }
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

@media (max-width: 1100px) {
  .detail-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>