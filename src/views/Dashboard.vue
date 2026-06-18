<template>
  <div class="dashboard-page">
    <!-- HEADER -->
    <div class="dashboard-header">
      <div>
        <h1>{{ greeting }}, {{ user?.name || "Admin" }}</h1>
        <div class="dashboard-meta">
          {{ todayLabel }} <span>•</span> Workshop is open
        </div>
        <p>Here's what's happening at your workshop today.</p>
      </div>

      <div class="dashboard-header-actions">
        <button class="btn btn-secondary btn-pill">
          Today
        </button>

        <router-link to="/transactions/create" class="btn btn-primary btn-pill">
          + New transaction
        </router-link>
      </div>
    </div>

    <!-- KPI STRIP -->
    <div class="metric-strip">
      <div class="metric-item">
        <div class="metric-top">
          <span>Today's Revenue</span>
          <div class="metric-icon">↗</div>
        </div>
        <strong>RM {{ formatMoney(todayRevenue) }}</strong>
        <small>From paid receipts today</small>
      </div>

      <div class="metric-item">
        <div class="metric-top">
          <span>Active Invoices</span>
          <div class="metric-icon">≡</div>
        </div>
        <strong>{{ activeInvoices }}</strong>
        <small>Awaiting payment</small>
      </div>

      <div class="metric-item">
        <div class="metric-top">
          <span>Pending Receipts</span>
          <div class="metric-icon">◔</div>
        </div>
        <strong>RM {{ formatMoney(pendingReceiptsAmount) }}</strong>
        <small>From {{ pendingReceiptsCount }} transaction(s)</small>
      </div>

      <div class="metric-item">
        <div class="metric-top">
          <span>Low Stock Alerts</span>
          <div class="metric-icon">!</div>
        </div>
        <strong>{{ lowStockItems.length }}</strong>
        <small>{{ lowStockItems.length }} critical</small>
      </div>
    </div>

    <!-- MAIN DASHBOARD GRID -->
    <div class="dashboard-main-grid">
      <!-- TODAY TRANSACTIONS -->
      <section class="dash-card today-card">
        <div class="dash-card-header">
          <div>
            <h2>Today's transactions</h2>
            <p>Jobs created or updated today.</p>
          </div>

          <router-link to="/transactions" class="dash-link">View all</router-link>
        </div>

        <div v-if="todayTransactions.length" class="mini-table-wrap">
          <table class="mini-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Work</th>
                <th>Status</th>
                <th class="right">Total</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="trx in todayTransactions"
                :key="trx.id"
              >
                <td>
                  <strong>{{ trx.customer?.name || "-" }}</strong>
                  <span>{{ trx.vehicle?.license_plate || "-" }}</span>
                </td>

                <td>
                  {{ trx.items?.[0]?.name || trx.notes || "-" }}
                </td>

                <td>
                  <span class="type-badge" :class="statusClass(trx.status)">
                    {{ trx.status }}
                  </span>
                </td>

                <td class="right">
                  <strong>RM {{ formatMoney(trx.total_amount) }}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-dashboard-state">
          <div class="empty-icon">+</div>
          <strong>No transactions today</strong>
          <p>Create a new quotation or invoice when a customer arrives.</p>

          <router-link to="/transactions/create" class="btn btn-primary btn-pill">
            New transaction
          </router-link>
        </div>
      </section>

      <!-- NEEDS ATTENTION -->
      <section class="dash-card attention-card">
        <div class="dash-card-header">
          <div>
            <h2>Needs attention</h2>
            <p>Stock and online requests to review.</p>
          </div>
        </div>

        <div class="attention-section">
          <div class="attention-section-head">
            <span>Low Stock</span>
            <router-link to="/inventory" class="dash-link">Inventory</router-link>
          </div>

          <div
            v-if="lowStockItems.length"
            class="attention-item"
          >
            <div class="attention-item-top">
              <div>
                <strong>{{ lowStockItems[0].name }}</strong>
                <p>
                  {{ lowStockItems[0].stock }} in stock · Minimum
                  {{ lowStockItems[0].min_stock_threshold }}
                </p>
              </div>

              <span class="alert-pill">Critical</span>
            </div>

            <router-link to="/inventory" class="attention-action">
              Manage stock
            </router-link>
          </div>

          <div v-else class="mini-empty">
            No low stock items.
          </div>
        </div>

        <div class="attention-section">
          <div class="attention-section-head">
            <span>Online Requests</span>
            <router-link to="/online-requests" class="dash-link">Import</router-link>
          </div>

          <div
            v-if="onlineRequests.length"
            class="request-list"
          >
            <div
              v-for="request in onlineRequests.slice(0, 3)"
              :key="request.id"
              class="request-row"
            >
              <div>
                <strong>{{ request.name || request.customer_name || "-" }}</strong>
                <p>
                  {{ request.plate_number || request.vehicle_plate || "-" }}
                  <span v-if="request.vehicle_model"> · {{ request.vehicle_model }}</span>
                </p>
              </div>

              <span class="status-soft">
                {{ request.status || "Pending" }}
              </span>
            </div>
          </div>

          <div v-else class="mini-empty">
            No online requests.
          </div>
        </div>
      </section>

      <!-- RECENT ACTIVITY -->
      <section class="dash-card activity-card">
        <div class="dash-card-header">
          <div>
            <h2>Recent activity</h2>
            <p>Latest workshop updates.</p>
          </div>
        </div>

        <div v-if="recentActivities.length" class="activity-list">
          <div
            v-for="activity in recentActivities.slice(0, 5)"
            :key="activity.id"
            class="activity-row"
          >
            <span
              class="activity-dot"
              :class="activity.type || 'default'"
            ></span>

            <div>
              <p>{{ activity.message }}</p>
              <small>{{ activity.time_ago || activity.created_at }}</small>
            </div>
          </div>
        </div>

        <div v-else class="mini-empty">
          No recent activity.
        </div>
      </section>

      <!-- QUICK ACTIONS -->
      <section class="dash-card quick-card">
        <div class="dash-card-header">
          <div>
            <h2>Quick actions</h2>
            <p>Common workshop shortcuts.</p>
          </div>
        </div>

        <div class="quick-grid">
          <router-link to="/transactions/create" class="quick-action primary">
            <span>+</span>
            <div>
              <strong>New transaction</strong>
              <p>Create quotation or invoice</p>
            </div>
          </router-link>

          <router-link to="/inventory/create" class="quick-action">
            <span>◆</span>
            <div>
              <strong>Add part</strong>
              <p>Create inventory item</p>
            </div>
          </router-link>

          <router-link to="/online-requests" class="quick-action">
            <span>⇧</span>
            <div>
              <strong>Import requests</strong>
              <p>From online form</p>
            </div>
          </router-link>

          <router-link to="/reports" class="quick-action">
            <span>▥</span>
            <div>
              <strong>Reports</strong>
              <p>View business summary</p>
            </div>
          </router-link>
        </div>
      </section>
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
      error: "",

      summary: {
        today_revenue: 0,
        active_invoices: 0,
        pending_receipts_amount: 0,
        pending_receipts_count: 0,
        low_stock_count: 0,
        critical_stock_count: 0,
      },

      todayTransactionsRaw: [],
      weeklyRevenueRaw: [],
      lowStockItemsRaw: [],
      recentActivity: [],

      onlineRequests: [],
      importingRequests: false,
      importMessage: "",
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

    isAdmin() {
      return this.currentUser?.role === "admin";
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

    firstName() {
      const fullName = this.currentUser?.name || "there";
      return fullName.split(" ")[0];
    },

    greeting() {
      const hour = new Date().getHours();
      if (hour < 12) return "morning";
      if (hour < 18) return "afternoon";
      return "evening";
    },

    todayText() {
      return new Date().toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },

    metrics() {
      const baseMetrics = [];

      if (this.isAdmin) {
        baseMetrics.push({
          label: "TODAY'S REVENUE",
          value: `RM ${this.formatMoney(this.summary.today_revenue)}`,
          sub: "From paid receipts today",
          iconClass: "mi-soft",
          icon: "↗",
        });
      }

      baseMetrics.push(
        {
          label: "ACTIVE INVOICES",
          value: this.summary.active_invoices,
          sub: "Awaiting payment",
          iconClass: "mi-soft",
          icon: "≡",
        },
        {
          label: "PENDING RECEIPTS",
          value: this.isAdmin
            ? `RM ${this.formatMoney(this.summary.pending_receipts_amount)}`
            : this.summary.pending_receipts_count,
          sub: this.isAdmin
            ? `From ${this.summary.pending_receipts_count} transaction(s)`
            : "Transaction(s) awaiting receipt",
          iconClass: "mi-soft",
          icon: "◔",
        },
        {
          label: "LOW STOCK ALERTS",
          value: this.summary.low_stock_count,
          sub: `<span class="metric-down">${this.summary.critical_stock_count} critical</span>`,
          iconClass: "mi-soft",
          icon: "!",
        }
      );

      return baseMetrics;
    },

    todayTransactions() {
      return this.todayTransactionsRaw.map((trx) => {
        const firstItem = trx.items?.[0];
        const work =
        firstItem?.service_name ||
        firstItem?.part?.name ||
        firstItem?.note ||
        "Workshop service";

        return {
          id: trx.id,
          customer: trx.customer?.name || "-",
          plate: trx.vehicle?.license_plate || "-",
          work,
          status: this.capitalize(trx.status),
          badgeClass: this.statusClass(trx.status),
          total: `RM ${this.formatMoney(trx.total_amount)}`,
        };
      });
    },

    weeklyRevenueTotal() {
      const total = this.weeklyRevenueRaw.reduce(
        (sum, day) => sum + Number(day.total || 0),
        0
      );

      return `RM ${this.formatMoney(total)} this week`;
    },

    weeklyRevenue() {
      const max = Math.max(
        ...this.weeklyRevenueRaw.map((day) => Number(day.total || 0)),
        0
      );

      return this.weeklyRevenueRaw.map((day) => ({
        label: day.label,
        isToday: day.is_today,
        height: max > 0 ? Math.max(8, (Number(day.total || 0) / max) * 72) : 8,
      }));
    },

    lowStockItems() {
      return this.lowStockItemsRaw.map((item) => ({
        id: item.id,
        name: item.variant ? `${item.name} — ${item.variant}` : item.name,
        min: item.min_stock_threshold,
        left: item.stock,
        level: Number(item.stock || 0) <= 3 ? "critical" : "low",
      }));
    },
  },

  mounted() {
    this.fetchDashboard();
    this.fetchOnlineRequests();
  },

  methods: {
    async fetchDashboard() {
      const cached = sessionStorage.getItem("dashboard");

      this.error = "";

      if (cached) {
        this.applyDashboardData(JSON.parse(cached));
      } else {
        this.loading = true;
      }

      try {
        const res = await api.get("/dashboard");

        this.applyDashboardData(res.data);
        sessionStorage.setItem("dashboard", JSON.stringify(res.data));
      } catch (error) {
        console.error("Error loading dashboard:", error);
        this.error = error.response?.data?.message || "Failed to load dashboard.";
      } finally {
        this.loading = false;
      }
    },

    applyDashboardData(data) {
      this.summary = data.summary || this.summary;
      this.todayTransactionsRaw = data.today_transactions || [];
      this.weeklyRevenueRaw = data.weekly_revenue || [];
      this.lowStockItemsRaw = data.low_stock_items || [];
      this.recentActivity = data.recent_activity || [];
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

    async fetchOnlineRequests() {
      try {
        const res = await api.get("/online-requests");
        this.onlineRequests = res.data || [];
      } catch (error) {
        console.error("Error loading online requests:", error);
      }
    },

    async importOnlineRequests() {
      this.importingRequests = true;
      this.importMessage = "";
      this.error = "";

      try {
        const res = await api.post("/online-requests/import");

        this.importMessage = res.data.message || "Import completed.";

        await this.fetchOnlineRequests();
        await this.fetchDashboard();

        sessionStorage.removeItem("dashboard");
      } catch (error) {
        console.error("Error importing online requests:", error);
        this.error =
          error.response?.data?.message || "Failed to import online requests.";
      } finally {
        this.importingRequests = false;
      }
    },

 convertOnlineRequest(request) {
  this.$router.push({
    path: "/transactions/new",
    query: {
      customer_id: request.customer_id,
      vehicle_id: request.vehicle_id,
      request_id: request.id,
    },
  });
},

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    capitalize(value) {
      if (!value) return "-";
      return value.charAt(0).toUpperCase() + value.slice(1);
    },

    statusClass(status) {
      if (status === "receipt") return "badge-receipt";
      if (status === "invoice") return "badge-invoice";
      if (status === "quotation") return "badge-quotation";
      return "empty-inline";
    },
  },
};
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Header */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 27px;
  font-weight: 880;
  letter-spacing: -0.04em;
  color: #0f172a;
  line-height: 1.1;
}

.dashboard-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #64748b;
}

.dashboard-header p {
  margin: 7px 0 0;
  font-size: 13.5px;
  color: #8a96a8;
}

.dashboard-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* KPI strip */
.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid #dfe5ee;
  border-radius: 17px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.035);
}

.metric-item {
  min-height: 104px;
  padding: 16px 18px;
  border-right: 1px solid #e5eaf1;
}

.metric-item:last-child {
  border-right: none;
}

.metric-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.metric-top span {
  font-size: 10.5px;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #64748b;
  line-height: 1.25;
}

.metric-icon {
  width: 30px;
  height: 30px;
  border-radius: 11px;
  background: #f3f5f8;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 850;
  flex-shrink: 0;
}

.metric-item strong {
  display: block;
  margin-top: 13px;
  font-size: 21px;
  font-weight: 880;
  letter-spacing: -0.035em;
  color: #0f172a;
  line-height: 1.05;
}

.metric-item small {
  display: block;
  margin-top: 7px;
  font-size: 12.2px;
  color: #8a96a8;
  line-height: 1.35;
}

/* Main grid */
.dashboard-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(330px, 0.9fr);
  gap: 18px;
  align-items: start;
}

.dash-card {
  border: 1px solid #dfe5ee;
  border-radius: 17px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.035);
}

.today-card,
.activity-card {
  min-height: 275px;
}

.attention-card,
.quick-card {
  min-height: auto;
}

.dash-card-header {
  padding: 18px 20px 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.dash-card-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 850;
  color: #0f172a;
  letter-spacing: -0.015em;
}

.dash-card-header p {
  margin: 5px 0 0;
  font-size: 12.5px;
  color: #8a96a8;
}

.dash-link {
  font-size: 12.5px;
  font-weight: 800;
  color: #8a96a8;
  text-decoration: none;
  white-space: nowrap;
}

.dash-link:hover {
  color: #0f172a;
}

/* Mini table */
.mini-table-wrap {
  padding: 0 20px 20px;
}

.mini-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  border-radius: 13px;
}

.mini-table th {
  padding: 11px 14px;
  background: #f3f5f8;
  color: #64748b;
  font-size: 10.5px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: left;
}

.mini-table th:first-child {
  border-top-left-radius: 13px;
}

.mini-table th:last-child {
  border-top-right-radius: 13px;
}

.mini-table td {
  padding: 13px 14px;
  border-bottom: 1px solid #edf1f5;
  font-size: 12.8px;
  color: #334155;
  vertical-align: top;
}

.mini-table td strong {
  display: block;
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
}

.mini-table td span {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  color: #8a96a8;
}

.mini-table .right {
  text-align: right;
}

/* Empty state */
.empty-dashboard-state {
  margin: 0 20px 20px;
  min-height: 190px;
  border: 1px dashed #dfe5ee;
  border-radius: 15px;
  background: #fbfcfe;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 24px;
}

.empty-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #f3f5f8;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
}

.empty-dashboard-state strong {
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
}

.empty-dashboard-state p {
  max-width: 340px;
  margin: 0;
  font-size: 12.8px;
  line-height: 1.45;
  color: #8a96a8;
}

/* Needs attention */
.attention-section {
  padding: 0 20px 18px;
}

.attention-section + .attention-section {
  padding-top: 2px;
}

.attention-section-head {
  margin-bottom: 9px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attention-section-head span {
  font-size: 10.5px;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #64748b;
}

.attention-item {
  padding: 13px;
  border: 1px solid #dfe5ee;
  border-radius: 15px;
  background: #fbfcfe;
}

.attention-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.attention-item strong,
.request-row strong {
  display: block;
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
}

.attention-item p,
.request-row p {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 650;
  color: #8a96a8;
}

.alert-pill {
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid #fecaca;
  background: #fff5f5;
  color: #dc2626;
  font-size: 11.2px;
  font-weight: 850;
  white-space: nowrap;
}

.attention-action {
  margin-top: 12px;
  height: 34px;
  border: 1px solid #dfe5ee;
  border-radius: 12px;
  background: #ffffff;
  color: #334155;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12.5px;
  font-weight: 850;
  text-decoration: none;
}

.attention-action:hover {
  background: #f8fafc;
}

.request-list {
  display: flex;
  flex-direction: column;
  border: 1px solid #dfe5ee;
  border-radius: 15px;
  overflow: hidden;
  background: #fbfcfe;
}

.request-row {
  min-height: 58px;
  padding: 12px 13px;
  border-bottom: 1px solid #e5eaf1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.request-row:last-child {
  border-bottom: none;
}

.status-soft {
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid #e1e7ef;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.mini-empty {
  padding: 14px;
  border: 1px dashed #dfe5ee;
  border-radius: 14px;
  color: #8a96a8;
  font-size: 12.5px;
  background: #fbfcfe;
}

/* Activity */
.activity-list {
  padding: 0 20px 16px;
  max-height: 250px;
  overflow-y: auto;
}

.activity-row {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1f5;
}

.activity-row:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 999px;
  background: #3b82f6;
}

.activity-dot.paid,
.activity-dot.success {
  background: #16a34a;
}

.activity-dot.quotation,
.activity-dot.warning {
  background: #f59e0b;
}

.activity-row p {
  margin: 0;
  font-size: 12.8px;
  color: #334155;
  line-height: 1.35;
}

.activity-row small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #8a96a8;
}

/* Quick actions */
.quick-grid {
  padding: 0 20px 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.quick-action {
  min-height: 74px;
  padding: 13px;
  border: 1px solid #dfe5ee;
  border-radius: 15px;
  background: #fbfcfe;
  color: inherit;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: 0.16s ease;
}

.quick-action:hover {
  transform: translateY(-1px);
  border-color: #cbd5e1;
  background: #ffffff;
}

.quick-action.primary {
  grid-column: 1 / -1;
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.quick-action span {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 850;
  flex-shrink: 0;
}

.quick-action.primary span {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.quick-action strong {
  display: block;
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
}

.quick-action.primary strong {
  color: #ffffff;
}

.quick-action p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #8a96a8;
  line-height: 1.3;
}

.quick-action.primary p {
  color: rgba(255, 255, 255, 0.7);
}

/* Responsive */
@media (max-width: 1200px) {
  .dashboard-main-grid {
    grid-template-columns: 1fr;
  }

  .metric-strip {
    grid-template-columns: repeat(2, 1fr);
  }

  .metric-item:nth-child(2) {
    border-right: none;
  }

  .metric-item:nth-child(1),
  .metric-item:nth-child(2) {
    border-bottom: 1px solid #e5eaf1;
  }
}

@media (max-width: 760px) {
  .dashboard-header {
    flex-direction: column;
  }

  .dashboard-header-actions {
    width: 100%;
  }

  .dashboard-header-actions .btn {
    flex: 1;
  }

  .metric-strip {
    grid-template-columns: 1fr;
  }

  .metric-item {
    border-right: none;
    border-bottom: 1px solid #e5eaf1;
  }

  .metric-item:last-child {
    border-bottom: none;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-header h1 {
    font-size: 24px;
  }
}
</style>