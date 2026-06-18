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
      <!-- HERO / GREETING -->
      <div class="dashboard-hero">
        <div class="hero-copy">
          <h1 class="hero-title">
            Good {{ greeting }}, {{ firstName }}
          </h1>

          <div class="hero-meta">
            {{ todayText }} <span>•</span> Workshop is open
          </div>

          <p class="hero-subtitle">
            Here's what's happening at your workshop today.
          </p>
        </div>

        <div class="hero-actions">
          <button class="btn btn-secondary btn-pill" type="button">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle
                cx="6"
                cy="6"
                r="5"
                stroke="currentColor"
                stroke-width="1.2"
              />
              <path
                d="M6 3v3l2 2"
                stroke="currentColor"
                stroke-width="1.2"
                stroke-linecap="round"
              />
            </svg>
            Today
          </button>

          <router-link to="/transactions/new" class="btn btn-primary btn-pill link-btn">
            + New transaction
          </router-link>
        </div>
      </div>

      <!-- MAIN DASHBOARD SPLIT -->
      <div class="dashboard-shell">
        <!-- LEFT MAIN AREA -->
        <section class="dashboard-main-panel">
          
          <!-- KPI STRIP -->
          <section class="metric-strip" :class="{ 'staff-metrics': !isAdmin }">
            <div
              v-for="metric in metrics"
              :key="metric.label"
              class="metric-item"
            >
              <div class="metric-copy">
                <span class="metric-label">{{ metric.label }}</span>
                <strong class="metric-value">{{ metric.value }}</strong>
                <span class="metric-sub" v-html="metric.sub"></span>
              </div>

              <div class="metric-icon" :class="metric.iconClass">
                <span v-html="metric.icon"></span>
              </div>
            </div>
          </section>

          <!-- WORKSPACE GRID -->
          <div class="dashboard-work-grid">
            <!-- TODAY'S TRANSACTIONS -->
            <Card class="dashboard-card today-card">
              <template #header>
                <div>
                  <span class="card-title">Today's transactions</span>
                  <p class="card-subtitle">Jobs created or updated today.</p>
                </div>

                <router-link to="/transactions" class="card-link">
                  View all
                </router-link>
              </template>

              <div class="today-body">
                <table
                  v-if="todayTransactions.length > 0"
                  class="table table-compact dashboard-table"
                >
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Work</th>
                      <th>Status</th>
                      <th class="right">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="job in todayTransactions" :key="job.id">
                      <td>
                        <div class="item-name">{{ job.customer }}</div>
                        <div class="item-sub">{{ job.plate }}</div>
                      </td>

                      <td>
                        <div class="item-name">{{ job.work }}</div>
                      </td>

                      <td>
                        <span class="badge" :class="job.badgeClass">
                          {{ job.status }}
                        </span>
                      </td>

                      <td class="right">
                        <span class="money-text">{{ job.total }}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div v-else class="dashboard-empty-state">
                  <div class="empty-icon">＋</div>
                  <strong>No transactions today</strong>
                  <span>Create a new quotation or invoice when a customer arrives.</span>

                  <router-link to="/transactions/new" class="btn btn-primary btn-pill">
                    New transaction
                  </router-link>
                </div>
              </div>
            </Card>

            <!-- RECENT ACTIVITY -->
            <Card class="dashboard-card activity-card">
              <template #header>
                <div>
                  <span class="card-title">Recent activity</span>
                  <p class="card-subtitle">Latest workshop updates.</p>
                </div>
              </template>

              <div v-if="recentActivity.length === 0" class="dashboard-empty-line">
                No recent activity yet.
              </div>

              <div v-else class="activity-list">
                <div
                  v-for="activity in recentActivity"
                  :key="activity.text"
                  class="activity-item"
                >
                  <div class="act-dot-wrap">
                    <div class="act-dot" :class="activity.dotClass"></div>
                    <div class="act-line"></div>
                  </div>

                  <div class="activity-content">
                    <div class="act-text" v-html="activity.text"></div>
                    <div class="act-time">{{ activity.time }}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <!-- RIGHT RAIL -->
        <aside class="dashboard-right-panel">
          <!-- QUICK ACTIONS -->
          <Card class="dashboard-card quick-card">
            <template #header>
              <div>
                <span class="card-title">Quick actions</span>
                <p class="card-subtitle">Common workshop shortcuts.</p>
              </div>
            </template>

            <div class="quick-actions compact">
              <router-link to="/transactions/new" class="qa-btn primary-action">
                <div class="qa-icon qa-dark">
                  <svg class="qa-svg" viewBox="0 0 16 16">
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </div>

                <div>
                  <div class="qa-label">New transaction</div>
                  <div class="qa-desc">Create quotation or invoice</div>
                </div>
              </router-link>

              <router-link to="/inventory/new" class="qa-btn">
                <div class="qa-icon qa-blue">
                  <svg class="qa-svg" viewBox="0 0 16 16">
                    <path d="M3 5.5L8 3l5 2.5v5L8 13l-5-2.5v-5Z" />
                    <path d="M3 5.5L8 8l5-2.5" />
                    <path d="M8 8v5" />
                  </svg>
                </div>

                <div>
                  <div class="qa-label">Add part</div>
                  <div class="qa-desc">Create inventory item</div>
                </div>
              </router-link>

              <button
                class="qa-btn"
                type="button"
                :disabled="importingRequests"
                @click="importOnlineRequests"
              >
                <div class="qa-icon qa-amber">
                  <svg class="qa-svg" viewBox="0 0 16 16">
                    <path d="M8 11V4" />
                    <path d="M5.5 6.5L8 4l2.5 2.5" />
                    <path d="M3 11.5v1.5h10v-1.5" />
                  </svg>
                </div>

                <div>
                  <div class="qa-label">Import requests</div>
                  <div class="qa-desc">
                    {{ importingRequests ? "Importing..." : "From online form" }}
                  </div>
                </div>
              </button>

              <router-link v-if="isAdmin" to="/reports" class="qa-btn">
                <div class="qa-icon qa-purple">
                  <svg class="qa-svg" viewBox="0 0 16 16">
                    <path d="M3 13V8" />
                    <path d="M8 13V4" />
                    <path d="M13 13V6" />
                    <path d="M2 13h12" />
                  </svg>
                </div>

                <div>
                  <div class="qa-label">Reports</div>
                  <div class="qa-desc">View business summary</div>
                </div>
              </router-link>

              <router-link v-else to="/customers" class="qa-btn">
                <div class="qa-icon qa-purple">
                  <svg class="qa-svg" viewBox="0 0 16 16">
                    <circle cx="8" cy="5" r="3" />
                    <path d="M2.5 14c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
                  </svg>
                </div>

                <div>
                  <div class="qa-label">Customers</div>
                  <div class="qa-desc">View customer list</div>
                </div>
              </router-link>
            </div>
          </Card>

          <!-- NEEDS ATTENTION -->
          <Card class="dashboard-card attention-card">
            <template #header>
              <div>
                <span class="card-title">Needs attention</span>
                <p class="card-subtitle">Stock and online requests to review.</p>
              </div>
            </template>

            <div class="attention-stack">
              <!-- LOW STOCK SECTION -->
              <section class="attention-section">
                <div class="attention-section-head">
                  <span>Low stock</span>

                  <router-link to="/inventory" class="card-link">
                    Inventory
                  </router-link>
                </div>

                <div v-if="lowStockItems.length === 0" class="attention-empty">
                  No low stock alerts.
                </div>

                <div v-else class="attention-list">
                  <div
                    v-for="item in lowStockItems.slice(0, 2)"
                    :key="item.id || item.name"
                    class="attention-item"
                  >
                    <div>
                      <div class="attention-name">{{ item.name }}</div>
                      <div class="attention-meta">
                        {{ item.left }} in stock · Minimum {{ item.min }}
                      </div>
                    </div>

                    <span
                      class="attention-pill"
                      :class="{ critical: item.level === 'critical' }"
                    >
                      {{ item.level === "critical" ? "Critical" : "Low" }}
                    </span>
                  </div>

                  <router-link to="/inventory" class="attention-action">
                    Manage stock
                  </router-link>
                </div>
              </section>

              <!-- ONLINE REQUEST SECTION -->
              <section class="attention-section">
                <div class="attention-section-head">
                  <span>Online requests</span>

                  <button
                    class="card-link btn-link"
                    type="button"
                    :disabled="importingRequests"
                    @click="importOnlineRequests"
                  >
                    {{ importingRequests ? "Importing..." : "Import" }}
                  </button>
                </div>

                <div v-if="importMessage" class="import-message compact">
                  {{ importMessage }}
                </div>

                <div v-if="onlineRequests.length === 0" class="attention-empty">
                  No online requests.
                </div>

                <div v-else class="attention-list">
                  <div
                    v-for="request in onlineRequests.slice(0, 3)"
                    :key="request.id"
                    class="attention-item request-item"
                  >
                    <div class="request-copy">
                      <div class="attention-name">
                        {{ request.customer?.name || request.customer_name || "-" }}
                      </div>

                      <div class="attention-meta">
                        {{ request.vehicle?.license_plate || request.license_plate || "-" }}

                        <span v-if="request.vehicle?.make || request.vehicle_make">
                          · {{ request.vehicle?.make || request.vehicle_make }}
                        </span>

                        <span v-if="request.vehicle?.model || request.vehicle_model">
                          {{ request.vehicle?.model || request.vehicle_model }}
                        </span>
                      </div>
                    </div>

                    <div class="request-actions">
                      <span class="badge badge-muted">
                        {{ request.status }}
                      </span>

                      <button
                        v-if="request.status !== 'converted'"
                        class="or-convert-btn"
                        type="button"
                        @click="convertOnlineRequest(request)"
                      >
                        Convert
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </Card>
        </aside>
      </div>

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
/* =========================
   PAGE BASE
========================= */
.main {
  min-height: 100vh;
  padding: 30px 38px 42px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 34%),
    var(--bg);
}

/* =========================
   HERO
========================= */
.dashboard-hero {
  max-width: 1380px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 22px;
  margin-bottom: 18px;
}

.hero-copy {
  min-width: 0;
}

.hero-title {
  margin: 0;
  font-size: 27px;
  font-weight: 850;
  letter-spacing: -0.055em;
  line-height: 1.05;
  color: #0f172a;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 10.5px;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #7c8798;
}

.hero-meta span {
  color: #c3cad5;
}

.hero-subtitle {
  margin: 7px 0 0;
  font-size: 13px;
  color: #8a96a8;
  line-height: 1.4;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* =========================
   MAIN LAYOUT
========================= */
.dashboard-shell {
  max-width: 1380px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
  align-items: start;
}

.dashboard-main-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dashboard-right-panel {
  min-width: 0;
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dashboard-card {
  overflow: hidden;
}

.dashboard-card :deep(.card-header),
.dashboard-card :deep(.card-head) {
  align-items: flex-start;
  margin-bottom: 10px;
}

.dashboard-card :deep(.card-body),
.dashboard-card :deep(.card-content) {
  padding-top: 0;
}

.card-title {
  font-size: 13.2px;
  font-weight: 850;
  color: #0f172a;
}

.card-subtitle {
  margin: 3px 0 0;
  font-size: 11.8px;
  font-weight: 500;
  color: #8a96a8;
  line-height: 1.35;
}

.card-link,
.btn-link {
  font-size: 11.8px;
  font-weight: 800;
  color: #8a96a8;
  text-decoration: none;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
}

.card-link:hover,
.btn-link:hover {
  color: #0f172a;
}

/* =========================
   KPI METRIC STRIP
========================= */
.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid #dfe5ee;
  border-radius: 17px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.03);
}

.metric-strip.staff-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-item {
  min-height: 82px;
  padding: 14px 16px;
  border-right: 1px solid #e5eaf1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.metric-item:last-child {
  border-right: none;
}

.metric-copy {
  min-width: 0;
}

.metric-label {
  display: block;
  max-width: 128px;
  font-size: 9.6px;
  font-weight: 850;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  color: #7c8798;
  line-height: 1.2;
}

.metric-value {
  display: block;
  margin-top: 9px;
  font-size: 19px;
  font-weight: 850;
  letter-spacing: -0.045em;
  color: #0f172a;
  line-height: 1;
}

.metric-sub {
  display: block;
  margin-top: 6px;
  font-size: 11.3px;
  color: #8a96a8;
  line-height: 1.25;
}

.metric-icon {
  width: 29px;
  height: 29px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Existing metric icon classes */
.mi-soft {
  background: #f4f6f8;
  color: #475569;
}

.mi-green {
  background: #eefaf2;
  color: #16803d;
}

.mi-blue {
  background: #eef5ff;
  color: #2563eb;
}

.mi-amber {
  background: #fff7e8;
  color: #c87513;
}

.mi-red {
  background: #fff1f1;
  color: #dc2626;
}

/* =========================
   MAIN WORK GRID
========================= */
.dashboard-work-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(310px, 0.85fr);
  gap: 14px;
  align-items: start;
}

.today-card,
.activity-card {
  min-height: 300px;
}

.today-body {
  min-height: 0;
}

.dashboard-table {
  border-radius: 13px;
  overflow: hidden;
}

.dashboard-table th {
  height: 34px;
  padding: 0 14px;
  font-size: 10px;
  letter-spacing: 0.105em;
}

.dashboard-table td {
  padding: 12px 14px;
  vertical-align: top;
}

.dashboard-table th:nth-child(1),
.dashboard-table td:nth-child(1) {
  width: 31%;
}

.dashboard-table th:nth-child(2),
.dashboard-table td:nth-child(2) {
  width: 31%;
}

.dashboard-table th:nth-child(3),
.dashboard-table td:nth-child(3) {
  width: 18%;
}

.dashboard-table th:nth-child(4),
.dashboard-table td:nth-child(4) {
  width: 20%;
}

.dashboard-table .item-name {
  font-size: 12.6px;
  font-weight: 850;
}

.dashboard-table .item-sub {
  margin-top: 3px;
  font-size: 11.3px;
  color: #8a96a8;
}

.money-text {
  font-size: 12.6px;
  font-weight: 800;
}

/* Empty state */
.dashboard-empty-state {
  min-height: 205px;
  border: 1px dashed #dfe5ee;
  border-radius: 15px;
  background: #fbfcfe;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 22px;
}

.dashboard-empty-state .empty-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: #f3f6fa;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.dashboard-empty-state strong {
  font-size: 13.2px;
  font-weight: 850;
  color: #0f172a;
}

.dashboard-empty-state span {
  max-width: 285px;
  margin-bottom: 6px;
  font-size: 12px;
  color: #8a96a8;
  line-height: 1.4;
}

.dashboard-empty-line,
.attention-empty {
  padding: 8px 0 2px;
  font-size: 12.2px;
  color: #8a96a8;
  font-style: italic;
}

/* =========================
   ACTIVITY
========================= */
.activity-list {
  max-height: 255px;
  overflow-y: auto;
  padding-right: 5px;
  display: flex;
  flex-direction: column;
}

.activity-list::-webkit-scrollbar {
  width: 5px;
}

.activity-list::-webkit-scrollbar-thumb {
  background: #dfe5ee;
  border-radius: 999px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 2px;
  border-bottom: 1px solid #edf1f6;
}

.activity-item:last-child {
  border-bottom: none;
}

.act-dot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 5px;
  flex-shrink: 0;
}

.act-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.dot-green {
  background: #16a34a;
}

.dot-blue {
  background: #2563eb;
}

.dot-amber {
  background: #f59e0b;
}

.dot-purple {
  background: #7c3aed;
}

.act-line {
  width: 1px;
  min-height: 18px;
  flex: 1;
  margin-top: 5px;
  background: #e5eaf1;
}

.activity-item:last-child .act-line {
  display: none;
}

.activity-content {
  min-width: 0;
}

.act-text {
  font-size: 12.15px;
  color: #475569;
  line-height: 1.38;
}

.act-bold {
  font-weight: 800;
  color: #0f172a;
}

.act-time {
  margin-top: 3px;
  font-size: 10.8px;
  color: #8a96a8;
}

/* =========================
   QUICK ACTIONS
========================= */
.quick-actions.compact {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.qa-btn {
  min-height: 48px;
  padding: 9px 10px;
  border-radius: 13px;
  border: 1px solid #dfe5ee;
  background: #fbfcfe;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.qa-btn:hover {
  background: #ffffff;
  border-color: #cfd8e6;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.045);
}

.qa-btn.primary-action {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.qa-btn.primary-action .qa-label,
.qa-btn.primary-action .qa-desc {
  color: #ffffff;
}

.qa-btn.primary-action .qa-desc {
  opacity: 0.72;
}

.qa-icon {
  width: 29px;
  height: 29px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qa-svg,
.metric-icon svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.qa-label {
  font-size: 12.4px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.2;
}

.qa-desc {
  margin-top: 2px;
  font-size: 11px;
  color: #8a96a8;
  line-height: 1.25;
}

.qa-dark {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.qa-blue {
  background: #eef5ff;
  color: #2563eb;
}

.qa-amber {
  background: #fff7e8;
  color: #c87513;
}

.qa-purple {
  background: #f4f1ff;
  color: #7c3aed;
}

/* =========================
   NEEDS ATTENTION CARD
========================= */
.attention-card {
  min-height: 0;
}

.attention-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attention-section {
  padding: 11px;
  border: 1px solid #e1e7ef;
  border-radius: 15px;
  background: #fbfcfe;
}

.attention-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
}

.attention-section-head span {
  font-size: 11.5px;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.attention-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.attention-item {
  min-height: 45px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.attention-name {
  font-size: 12.8px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.25;
}

.attention-meta {
  margin-top: 3px;
  font-size: 11.3px;
  font-weight: 600;
  color: #8a96a8;
  line-height: 1.3;
}

.attention-pill {
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid #fed7aa;
  background: #fff7ed;
  color: #c2410c;
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 850;
  white-space: nowrap;
}

.attention-pill.critical {
  border-color: #fecaca;
  background: #fff1f2;
  color: #dc2626;
}

.attention-action {
  height: 30px;
  margin-top: 2px;
  border-radius: 11px;
  border: 1px solid #dfe5ee;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11.4px;
  font-weight: 800;
  color: #475569;
  text-decoration: none;
}

.attention-action:hover {
  border-color: #cfd8e6;
  color: #0f172a;
}

.request-item {
  align-items: center;
  padding-top: 2px;
  padding-bottom: 2px;
}

.request-copy {
  min-width: 0;
}

.request-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

.request-actions .badge {
  font-size: 10.5px;
  padding: 4px 9px;
}

.or-convert-btn {
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 850;
  cursor: pointer;
}

.import-message.compact {
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 11px;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
  font-size: 11.5px;
  font-weight: 650;
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 1280px) {
  .main {
    padding: 30px 32px 40px;
  }

  .dashboard-shell {
    grid-template-columns: minmax(0, 1fr) 320px;
  }

  .dashboard-work-grid {
    grid-template-columns: 1fr;
  }

  .today-card,
  .activity-card {
    min-height: auto;
  }
}

@media (max-width: 1120px) {
  .dashboard-shell {
    grid-template-columns: 1fr;
  }

  .dashboard-right-panel {
    position: static;
  }

  .metric-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-strip.staff-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-item:nth-child(2n) {
    border-right: none;
  }

  .metric-item:nth-child(-n + 2) {
    border-bottom: 1px solid #e5eaf1;
  }

  .quick-actions.compact {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .attention-stack {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 700px) {
  .main {
    padding: 24px 16px;
  }

  .dashboard-hero {
    flex-direction: column;
    gap: 18px;
  }

  .hero-title {
    font-size: 25px;
  }

  .hero-actions {
    width: 100%;
    justify-content: space-between;
  }

  .metric-strip,
  .metric-strip.staff-metrics,
  .quick-actions.compact,
  .attention-stack {
    grid-template-columns: 1fr;
  }

  .metric-item,
  .metric-item:nth-child(2n),
  .metric-item:nth-child(-n + 2) {
    border-right: none;
    border-bottom: 1px solid #e5eaf1;
  }

  .metric-item:last-child {
    border-bottom: none;
  }
}
</style>