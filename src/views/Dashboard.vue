<template>
  <div class="app-shell" :class="{ collapsed }">
    <Sidebar
      :collapsed="collapsed"
      :menu="menu"
      :current-user="currentUser"
      @toggle="toggleSidebar"
      @logout="handleLogout"
    />

    <main class="page-content dashboard-page">
      <!-- HEADER -->
      <div class="dashboard-header">
        <div>
          <h1>Good {{ greeting }}, {{ firstName }}</h1>

          <div class="dashboard-meta">
            <span>{{ todayText }}</span>
            <span>•</span>
            <span>Workshop is open</span>
          </div>

          <p>Here's what's happening at your workshop today.</p>
        </div>

        <div class="dashboard-header-actions">
          <button type="button" class="btn btn-secondary btn-pill">
            ◷ Today
          </button>

          <router-link to="/transactions/new" class="btn btn-primary btn-pill">
            + New transaction
          </router-link>
        </div>
      </div>

      <div v-if="error" class="page-error">
        {{ error }}
      </div>

      <!-- KPI STRIP -->
      <section class="metric-strip">
        <div
          v-for="metric in metrics"
          :key="metric.label"
          class="metric-cell"
        >
          <div class="metric-top">
            <span>{{ metric.label }}</span>
            <div class="metric-icon">{{ metric.icon }}</div>
          </div>

          <strong>{{ metric.value }}</strong>

          <p v-html="metric.sub"></p>
        </div>
      </section>

      <!-- MAIN GRID -->
      <section class="dashboard-grid-clean">
        <!-- TODAY TRANSACTIONS -->
        <Card class="dashboard-panel today-panel">
          <div class="panel-head">
            <div>
              <h3>Today's transactions</h3>
              <p>Jobs created or updated today.</p>
            </div>

            <router-link to="/transactions" class="panel-link">
              View all
            </router-link>
          </div>

          <div v-if="todayTransactions.length > 0" class="mini-table-wrap">
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
                  @click="$router.push(`/transactions/${trx.id}`)"
                >
                  <td>
                    <strong>{{ trx.customer }}</strong>
                    <span>{{ trx.plate }}</span>
                  </td>

                  <td>
                    <strong>{{ trx.work }}</strong>
                  </td>

                  <td>
                    <span class="status-badge" :class="trx.badgeClass">
                      {{ trx.status }}
                    </span>
                  </td>

                  <td class="right">
                    <strong>{{ trx.total }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-else class="dashboard-empty-state">
            <div class="empty-icon">+</div>
            <strong>No transactions today</strong>
            <p>Create a quotation or invoice when a customer arrives.</p>

            <router-link to="/transactions/new" class="btn btn-primary btn-pill">
              New transaction
            </router-link>
          </div>
        </Card>

        <!-- NEEDS ATTENTION -->
        <Card class="dashboard-panel attention-panel">
          <div class="panel-head">
            <div>
              <h3>Needs attention</h3>
              <p>Stock and online requests to review.</p>
            </div>
          </div>

          <div class="attention-section">
            <div class="attention-title-row">
              <span>Low stock</span>

              <router-link to="/inventory" class="panel-link">
                Inventory
              </router-link>
            </div>

            <div v-if="lowStockItems.length > 0" class="attention-list">
              <div
                v-for="item in lowStockItems.slice(0, 2)"
                :key="item.id"
                class="attention-item"
              >
                <div class="attention-item-top">
                  <div>
                    <strong>{{ item.name }}</strong>
                    <p>{{ item.left }} in stock · Minimum {{ item.min }}</p>
                  </div>

                  <span
                    class="attention-pill"
                    :class="item.level === 'critical' ? 'danger' : 'warning'"
                  >
                    {{ item.level === "critical" ? "Critical" : "Low" }}
                  </span>
                </div>

                <router-link
                  to="/inventory"
                  class="btn btn-secondary btn-pill attention-btn"
                >
                  Manage stock
                </router-link>
              </div>
            </div>

            <div v-else class="attention-empty">
              Stock levels look okay.
            </div>
          </div>

          <div class="attention-section">
            <div class="attention-title-row">
              <span>Online requests</span>

              <button
                type="button"
                class="panel-link button-link"
                :disabled="importingRequests"
                @click="importOnlineRequests"
              >
                {{ importingRequests ? "Importing..." : "Import" }}
              </button>
            </div>

            <div v-if="onlineRequests.length > 0" class="request-list-clean">
              <div
                v-for="request in onlineRequests.slice(0, 3)"
                :key="request.id"
                class="request-item-clean"
                @click="convertOnlineRequest(request)"
              >
                <div>
                  <strong>{{ request.customer?.name || request.name || "-" }}</strong>
                  <p>
                    {{ request.vehicle?.license_plate || request.plate_number || "-" }}
                    <span v-if="request.vehicle?.model || request.car_model">
                      · {{ request.vehicle?.model || request.car_model }}
                    </span>
                  </p>
                </div>

                <span class="small-pill">
                  {{ request.status || "Pending" }}
                </span>
              </div>
            </div>

            <div v-else class="attention-empty">
              No online requests waiting.
            </div>
          </div>
        </Card>

        <!-- RECENT ACTIVITY -->
        <Card class="dashboard-panel activity-panel">
          <div class="panel-head">
            <div>
              <h3>Recent activity</h3>
              <p>Latest workshop updates.</p>
            </div>
          </div>

          <div v-if="recentActivity.length > 0" class="activity-list-clean">
            <div
              v-for="(activity, index) in recentActivity.slice(0, 6)"
              :key="index"
              class="activity-row-clean"
            >
              <span
                class="activity-dot"
                :class="activity.type || 'default'"
              ></span>

              <div>
                <p>{{ activity.message }}</p>
                <small>{{ activity.time || activity.created_at || "-" }}</small>
              </div>
            </div>
          </div>

          <div v-else class="attention-empty">
            No recent activity yet.
          </div>
        </Card>

        <!-- QUICK ACTIONS -->
        <Card class="dashboard-panel quick-panel">
          <div class="panel-head">
            <div>
              <h3>Quick actions</h3>
              <p>Common workshop shortcuts.</p>
            </div>
          </div>

          <div class="quick-grid-clean">
            <router-link to="/transactions/new" class="quick-action-clean primary">
              <span>+</span>
              <div>
                <strong>New transaction</strong>
                <p>Create quotation or invoice</p>
              </div>
            </router-link>

            <router-link to="/inventory/new" class="quick-action-clean">
              <span>▣</span>
              <div>
                <strong>Add part</strong>
                <p>Create inventory item</p>
              </div>
            </router-link>

            <button
              type="button"
              class="quick-action-clean"
              :disabled="importingRequests"
              @click="importOnlineRequests"
            >
              <span>⇧</span>
              <div>
                <strong>Import requests</strong>
                <p>From online form</p>
              </div>
            </button>

            <router-link
              v-if="isAdmin"
              to="/reports"
              class="quick-action-clean"
            >
              <span>▥</span>
              <div>
                <strong>Reports</strong>
                <p>View business summary</p>
              </div>
            </router-link>
          </div>
        </Card>
      </section>
    </main>
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
        level:
          Number(item.stock || 0) <= Number(item.min_stock_threshold || 0)
            ? "critical"
            : "low",
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
  padding-bottom: 42px;
}

/* HEADER */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 20px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 27px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #0f172a;
}

.dashboard-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #748195;
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

/* KPI STRIP */
.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
  border: 1px solid #dfe5ee;
  border-radius: 17px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
}

.metric-cell {
  min-height: 96px;
  padding: 16px 18px;
  border-right: 1px solid #e5eaf1;
}

.metric-cell:last-child {
  border-right: none;
}

.metric-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.metric-top span {
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #748195;
  line-height: 1.25;
}

.metric-icon {
  width: 31px;
  height: 31px;
  border-radius: 12px;
  background: #f5f7fa;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 14px;
  font-weight: 900;
  flex-shrink: 0;
}

.metric-cell strong {
  display: block;
  margin-top: 11px;
  font-size: 21px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #0f172a;
  line-height: 1.05;
}

.metric-cell p {
  margin: 7px 0 0;
  font-size: 12.5px;
  color: #8a96a8;
  line-height: 1.25;
}

.metric-down {
  color: #dc2626;
  font-weight: 750;
}

/* MAIN DASHBOARD GRID */
.dashboard-grid-clean {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
  gap: 14px;
  align-items: start;
}

.dashboard-panel {
  min-width: 0;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.panel-head h3 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 850;
  color: #0f172a;
}

.panel-head p {
  margin: 5px 0 0;
  font-size: 12.5px;
  color: #8a96a8;
  line-height: 1.35;
}

.panel-link,
.button-link {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 12.5px;
  font-weight: 750;
  color: #8a96a8;
  text-decoration: none;
  cursor: pointer;
}

.panel-link:hover,
.button-link:hover {
  color: #0f172a;
}

/* TODAY TABLE */
.today-panel {
  min-height: 300px;
}

.mini-table-wrap {
  border: 1px solid #e5eaf1;
  border-radius: 14px;
  overflow: hidden;
}

.mini-table {
  width: 100%;
  border-collapse: collapse;
}

.mini-table th {
  padding: 11px 14px;
  background: #f5f7fa;
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #748195;
  text-align: left;
}

.mini-table td {
  padding: 13px 14px;
  border-top: 1px solid #edf1f6;
  font-size: 12.8px;
  color: #526173;
  vertical-align: top;
}

.mini-table tbody tr {
  cursor: pointer;
  transition: background 0.15s ease;
}

.mini-table tbody tr:hover {
  background: #fbfcfe;
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

.status-badge {
  display: inline-flex !important;
  width: fit-content;
  margin: 0 !important;
}

/* EMPTY STATE */
.dashboard-empty-state {
  min-height: 205px;
  border: 1px dashed #dfe5ee;
  border-radius: 15px;
  background: #fbfcfe;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 9px;
  text-align: center;
  padding: 24px;
}

.dashboard-empty-state .empty-icon {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  background: #f3f6fa;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
}

.dashboard-empty-state strong {
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
}

.dashboard-empty-state p {
  max-width: 300px;
  margin: 0;
  font-size: 12.8px;
  line-height: 1.45;
  color: #8a96a8;
}

/* NEEDS ATTENTION */
.attention-panel {
  grid-row: span 2;
}

.attention-section {
  padding: 13px;
  border: 1px solid #e1e7ef;
  border-radius: 15px;
  background: #fbfcfe;
}

.attention-section + .attention-section {
  margin-top: 12px;
}

.attention-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.attention-title-row span {
  font-size: 10.5px;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #64748b;
}

.attention-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attention-item {
  padding: 12px;
  border: 1px solid #dfe5ee;
  border-radius: 14px;
  background: #ffffff;
}

.attention-item-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.attention-item strong {
  font-size: 13.5px;
  font-weight: 850;
  color: #0f172a;
}

.attention-item p {
  margin: 4px 0 0;
  font-size: 12.2px;
  font-weight: 650;
  color: #8a96a8;
}

.attention-pill {
  height: 25px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11.5px;
  font-weight: 850;
  flex-shrink: 0;
}

.attention-pill.danger {
  color: #dc2626;
  background: #fff1f0;
  border: 1px solid #fecaca;
}

.attention-pill.warning {
  color: #b45309;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.attention-btn {
  width: 100%;
  margin-top: 12px;
  justify-content: center;
}

.attention-empty {
  padding: 12px;
  border-radius: 12px;
  background: #ffffff;
  border: 1px dashed #dfe5ee;
  font-size: 12.5px;
  color: #8a96a8;
}

/* ONLINE REQUESTS */
.request-list-clean {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding-right: 3px;
}

.request-item-clean {
  padding: 11px 12px;
  border: 1px solid #dfe5ee;
  border-radius: 13px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.request-item-clean:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.request-item-clean strong {
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
}

.request-item-clean p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #8a96a8;
}

.small-pill {
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f3f5f8;
  border: 1px solid #e1e7ef;
  color: #64748b;
  font-size: 11.2px;
  font-weight: 800;
  white-space: nowrap;
}

/* RECENT ACTIVITY */
.activity-panel {
  min-height: 245px;
}

.activity-list-clean {
  max-height: 260px;
  overflow-y: auto;
  padding-right: 5px;
}

.activity-row-clean {
  position: relative;
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 11px;
  padding: 10px 0;
  border-bottom: 1px solid #edf1f6;
}

.activity-row-clean:last-child {
  border-bottom: none;
}

.activity-dot {
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 999px;
  background: #2563eb;
}

.activity-dot.payment,
.activity-dot.receipt,
.activity-dot.success {
  background: #16a34a;
}

.activity-dot.quotation {
  background: #f59e0b;
}

.activity-row-clean p {
  margin: 0;
  font-size: 12.8px;
  color: #526173;
  line-height: 1.35;
}

.activity-row-clean small {
  display: block;
  margin-top: 4px;
  font-size: 11.8px;
  color: #8a96a8;
}

/* QUICK ACTIONS */
.quick-grid-clean {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.quick-action-clean {
  min-height: 72px;
  padding: 13px;
  border: 1px solid #dfe5ee;
  border-radius: 15px;
  background: #fbfcfe;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.quick-action-clean:hover {
  background: #ffffff;
  transform: translateY(-1px);
}

.quick-action-clean span {
  width: 34px;
  height: 34px;
  border-radius: 13px;
  background: #f0f4fa;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 850;
  flex-shrink: 0;
}

.quick-action-clean strong {
  display: block;
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
}

.quick-action-clean p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #8a96a8;
  line-height: 1.25;
}

.quick-action-clean.primary {
  background: #0f172a;
  border-color: #0f172a;
}

.quick-action-clean.primary span {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.quick-action-clean.primary strong {
  color: #ffffff;
}

.quick-action-clean.primary p {
  color: #cbd5e1;
}

/* RESPONSIVE */
@media (max-width: 1200px) {
  .dashboard-grid-clean {
    grid-template-columns: 1fr;
  }

  .attention-panel {
    grid-row: auto;
  }
}

@media (max-width: 900px) {
  .metric-strip {
    grid-template-columns: 1fr 1fr;
  }

  .metric-cell:nth-child(2n) {
    border-right: none;
  }

  .metric-cell {
    border-bottom: 1px solid #e5eaf1;
  }

  .metric-cell:nth-last-child(-n + 2) {
    border-bottom: none;
  }

  .dashboard-header {
    flex-direction: column;
  }

  .dashboard-header-actions {
    width: 100%;
  }

  .dashboard-header-actions .btn {
    flex: 1;
  }
}

@media (max-width: 640px) {
  .metric-strip,
  .quick-grid-clean {
    grid-template-columns: 1fr;
  }

  .metric-cell,
  .metric-cell:nth-child(2n),
  .metric-cell:nth-last-child(-n + 2) {
    border-right: none;
    border-bottom: 1px solid #e5eaf1;
  }

  .metric-cell:last-child {
    border-bottom: none;
  }

  .mini-table {
    min-width: 620px;
  }

  .mini-table-wrap {
    overflow-x: auto;
  }
}
</style>