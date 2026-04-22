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

                <td>
                  <div class="action-group">
                    <router-link
                    class="mini-btn link-btn"
                    :to="`/transactions/${trx.id}`"
                    >
                    View
                    </router-link>

                    <button class="mini-btn" @click="openWhatsApp(trx)">
                      WhatsApp
                    </button>

                    <button
                      v-if="trx.status === 'quotation'"
                      class="mini-btn primary"
                      :disabled="actionLoadingId === trx.id"
                      @click="confirmQuotation(trx.id)"
                    >
                      {{ actionLoadingId === trx.id ? "..." : "Confirm" }}
                    </button>

                    <button
                      v-if="trx.status === 'invoice'"
                      class="mini-btn success"
                      :disabled="actionLoadingId === trx.id"
                      @click="markPaid(trx.id)"
                    >
                      {{ actionLoadingId === trx.id ? "..." : "Mark Paid" }}
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
      collapsed: false,
      loading: false,
      actionLoadingId: null,
      error: "",

      menu: [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Expenses", path: "/expenses", icon: "alert" },
        { name: "Reports", path: "/reports", icon: "chart" }
      ],

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
    }
  },

  mounted() {
    this.fetchTransactions();
  },

  methods: {
    getCacheKey(page = 1) {
      return `transactions-${this.activeTab}-page-${page}`;
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
        const params = { page };

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

    async confirmQuotation(id) {
      this.actionLoadingId = id;
      this.error = "";

      try {
        await api.post(`/transactions/${id}/confirm`);
        this.clearTransactionCache();

        await this.fetchTransactions(this.page);
      } catch (error) {
        console.error("Error confirming quotation:", error);
        this.error =
          error.response?.data?.message || "Failed to confirm quotation.";
      } finally {
        this.actionLoadingId = null;
      }
    },

    async markPaid(id) {
      this.actionLoadingId = id;
      this.error = "";

      try {
        await api.post(`/transactions/${id}/pay`);
        this.clearTransactionCache();

        await this.fetchTransactions(this.page);
      } catch (error) {
        console.error("Error marking paid:", error);
        this.error =
          error.response?.data?.message || "Failed to mark transaction as paid.";
      } finally {
        this.actionLoadingId = null;
      }
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

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    formatDate(value) {
      if (!value) return "-";
      return new Date(value).toLocaleDateString("en-GB");
    }
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

</style>