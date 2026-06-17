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
          <div class="hero-meta">
            {{ todayText }} <span>•</span> Workshop is open
          </div>

          <h1 class="hero-title">
            Good {{ greeting }}, {{ firstName }}
          </h1>

          <p class="hero-subtitle">
            Here's what's happening at your workshop today.
          </p>
        </div>

        <div class="hero-actions">
          <button class="pill-btn btn btn-secondary btn-pill" type="button">
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

          <router-link to="/transactions/new" class="pill-btn primary btn btn-primary btn-pill link-btn">
            + New transaction
          </router-link>
        </div>
      </div>

      <!-- MAIN DASHBOARD SPLIT -->
      <div class="dashboard-shell">
        <!-- LEFT MAIN AREA -->
        <section class="dashboard-main-panel">
          <!-- KPI CARDS -->
          <div
            class="metrics-grid dashboard-metrics"
            :class="{ 'staff-metrics': !isAdmin }"
          >
            <div
              v-for="metric in metrics"
              :key="metric.label"
              class="metric-card"
            >
              <div class="metric-label">
                <span>{{ metric.label }}</span>

                <div class="metric-icon" :class="metric.iconClass">
                  <span v-html="metric.icon"></span>
                </div>
              </div>

              <div class="metric-value">
                {{ metric.value }}
              </div>

              <div class="metric-sub" v-html="metric.sub"></div>
            </div>
          </div>

          <!-- TODAY'S TRANSACTIONS -->
          <Card class="today-card dashboard-fixed-card">
            <template #header>
              <span class="card-title">Today's transactions</span>
              <router-link to="/transactions" class="card-link">
                View all
              </router-link>
            </template>

            <div class="card-scroll today-scroll">
              <table
                v-if="todayTransactions.length > 0"
                class="table compact-table"
              >
                <thead>
                  <tr>
                    <th>Customer / Plate</th>
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
                      <span class="status-pill" :class="job.badgeClass">
                        {{ job.status }}
                      </span>
                    </td>

                    <td class="right">
                      {{ job.total }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div v-else class="dashboard-empty-line">
                No transactions today.
              </div>
            </div>
          </Card>

          <!-- RECENT ACTIVITY -->
          <Card class="activity-card dashboard-fixed-card">
            <template #header>
              <span class="card-title">Recent activity</span>
            </template>

            <div v-if="recentActivity.length === 0" class="dashboard-empty-line">
              No recent activity yet.
            </div>

            <div v-else class="activity-list card-scroll activity-scroll">
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
        </section>

        <!-- RIGHT RAIL -->
        <aside class="dashboard-right-panel">
          <!-- QUICK ACTIONS -->
          <Card class="quick-card dashboard-fixed-card">
            <template #header>
              <span class="card-title rail-title">Quick actions</span>
            </template>

            <div class="quick-actions compact">
              <router-link to="/transactions/new" class="qa-btn">
  <div class="qa-icon qa-green">
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
    <div class="qa-desc">Create inventory part</div>
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
      <path d="M4.5 9.5H3.5a1 1 0 0 0-1 1v2.5" />
      <path d="M11.5 9.5h1a1 1 0 0 1 1 1v2.5" />
    </svg>
  </div>

  <div>
    <div class="qa-label">Import</div>
    <div class="qa-desc">
      {{ importingRequests ? "Importing..." : "Online requests" }}
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
    <div class="qa-label">Report</div>
    <div class="qa-desc">View business report</div>
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
    <div class="qa-label">Customer</div>
    <div class="qa-desc">View customer list</div>
  </div>
</router-link>
            </div>
          </Card>

          <!-- LOW STOCK -->
          <Card class="low-stock-card dashboard-fixed-card">
            <template #header>
              <span class="card-title">Low stock alerts</span>
              <router-link to="/inventory" class="card-link">
                View inventory
              </router-link>
            </template>

            <div v-if="lowStockItems.length === 0" class="dashboard-empty-line">
              No low stock alerts.
            </div>

            <div v-else class="stock-list card-scroll stock-scroll">
              <div
                v-for="item in lowStockItems"
                :key="item.id || item.name"
                class="stock-item"
              >
                <div class="stock-top">
                  <div class="stock-info">
                    <div class="stock-name">{{ item.name }}</div>
                    <div class="stock-min">
                      {{ item.left }} / {{ item.min }} minimum
                    </div>
                  </div>

                  <div class="stock-right">
                    <div class="stock-qty">{{ item.left }} left</div>

                    <span
                      class="stock-badge"
                      :class="item.level === 'critical' ? 'badge-crit' : 'badge-warn'"
                    >
                      {{ item.level === "critical" ? "Critical" : "Low" }}
                    </span>
                  </div>
                </div>

                <div class="stock-meter">
                  <div
                    class="stock-meter-fill"
                    :class="{ critical: item.level === 'critical' }"
                    :style="{
                      width:
                        Math.max(
                          0,
                          Math.min(
                            100,
                            (Number(item.left || 0) /
                              Math.max(Number(item.min || 1), 1)) *
                              100
                          )
                        ) + '%'
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          <!-- ONLINE REQUESTS -->
          <Card class="online-card dashboard-fixed-card">
            <template #header>
              <span class="card-title">Online requests</span>

              <button
                class="card-link btn-link"
                type="button"
                :disabled="importingRequests"
                @click="importOnlineRequests"
              >
                {{ importingRequests ? "Importing..." : "Import" }}
              </button>
            </template>

            <div v-if="importMessage" class="import-message">
              {{ importMessage }}
            </div>

            <div v-if="onlineRequests.length === 0" class="dashboard-empty-line">
              No online requests.
            </div>

            <div v-else class="online-request-list card-scroll online-scroll">
              <div
                v-for="request in onlineRequests"
                :key="request.id"
                class="online-request-item"
              >
                <div class="or-content">
                  <div class="or-name">
                    {{ request.customer?.name || request.customer_name || "-" }}
                  </div>

                  <div class="or-meta">
                    {{ request.vehicle?.license_plate || request.license_plate || "-" }}

                    <span v-if="request.vehicle?.make || request.vehicle_make">
                      · {{ request.vehicle?.make || request.vehicle_make }}
                    </span>

                    <span v-if="request.vehicle?.model || request.vehicle_model">
                      {{ request.vehicle?.model || request.vehicle_model }}
                    </span>
                  </div>

                  <div class="or-problem">
                    {{ request.problem_description || request.problem || "No problem stated" }}
                  </div>
                </div>

                <div class="or-actions">
                  <span class="or-status">
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
      if (status === "receipt") return "sp-green";
      if (status === "invoice") return "sp-blue";
      if (status === "quotation") return "sp-amber";
      return "sp-gray";
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
  padding: 32px 38px 40px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), transparent 34%),
    var(--bg);
}

.right {
  text-align: right;
}

.link-btn {
  text-decoration: none;
}

.btn-link {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.btn-link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* =========================
   HERO / GREETING
========================= */
.dashboard-hero {
  max-width: 1380px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.hero-copy {
  min-width: 0;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #777;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-meta span {
  color: #b8b8b8;
}

.hero-title {
  margin: 0;
  font-size: 30px;
  font-weight: 850;
  color: #111;
  line-height: 1.04;
  letter-spacing: -0.055em;
}

.hero-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #8a8a8a;
  line-height: 1.5;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

/* =========================
   DASHBOARD SPLIT LAYOUT
========================= */
.dashboard-shell {
  max-width: 1380px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 26px;
  align-items: start;
}

.dashboard-main-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.dashboard-right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 0 0 22px;
  border-left: 1px solid rgba(220, 220, 214, 0.9);
  background: linear-gradient(
    90deg,
    rgba(245, 244, 238, 0.65) 0%,
    rgba(245, 244, 238, 0.2) 100%
  );
  min-width: 0;
}

.dashboard-fixed-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dashboard-fixed-card :deep(.card-header),
.dashboard-fixed-card :deep(.card-head) {
  flex-shrink: 0;
  margin-bottom: 16px;
}

/* Softer dashboard card feeling */
.dashboard-fixed-card :deep(.card),
.dashboard-fixed-card {
  border-radius: 20px;
}

/* Better card heights */
.today-card {
  min-height: 245px;
}

.activity-card {
  min-height: 315px;
}

.quick-card {
  min-height: 230px;
}

.low-stock-card {
  min-height: 275px;
}

.online-card {
  min-height: 220px;
}

/* =========================
   KPI CARDS
========================= */
.metrics-grid,
.dashboard-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.dashboard-metrics.staff-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card {
  min-height: 100px;
  background: #fff;
  border: 1px solid #e8e8e3;
  border-radius: 17px;
  padding: 16px 18px;
  box-shadow: 0 16px 38px rgba(0, 0, 0, 0.035);
}

.metric-label {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 10.5px;
  font-weight: 850;
  color: #777;
  letter-spacing: 0.085em;
  text-transform: uppercase;
  line-height: 1.25;
}

.metric-value {
  font-size: 25px;
  font-weight: 850;
  color: #111;
  letter-spacing: -0.05em;
  line-height: 1;
}

.metric-sub {
  margin-top: 8px;
  font-size: 12px;
  color: #888;
  line-height: 1.35;
}

.metric-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
}

.mi-soft {
  background: #f4f4f3;
  color: #444;
}

.mi-green {
  background: #eff9eb;
  color: #2e7d32;
}

.mi-blue {
  background: #eef5ff;
  color: #1565c0;
}

.mi-amber {
  background: #fff5e7;
  color: #b8731f;
}

.mi-red {
  background: #fff0f0;
  color: #c93434;
}

/* =========================
   SCROLL AREAS
   Fewer visible scrollbars, more breathing room
========================= */
.card-scroll {
  overflow-y: auto;
  min-height: 0;
  padding-right: 6px;
}

.today-scroll {
  max-height: 195px;
}

.activity-scroll {
  max-height: 255px;
}

.stock-scroll {
  max-height: 220px;
}

.online-scroll {
  max-height: 165px;
}

.card-scroll::-webkit-scrollbar {
  width: 5px;
}

.card-scroll::-webkit-scrollbar-thumb {
  background: #e5e5df;
  border-radius: 999px;
}

.card-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.dashboard-empty-line {
  padding: 18px 0 6px;
  font-size: 13px;
  color: #999;
  font-style: italic;
}

/* =========================
   TODAY'S TRANSACTIONS
========================= */
.today-card .compact-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.compact-table th {
  padding: 11px 12px;
  font-size: 10.5px;
  font-weight: 850;
  color: #8f8f8f;
  text-transform: uppercase;
  letter-spacing: 0.085em;
  border-bottom: 1px solid #eeeeea;
  text-align: left;
}

.compact-table td {
  padding: 14px 12px;
  font-size: 13px;
  color: #2a2a2a;
  border-bottom: 1px solid #f2f2ee;
  vertical-align: middle;
}

.compact-table th:nth-child(1),
.compact-table td:nth-child(1) {
  width: 31%;
}

.compact-table th:nth-child(2),
.compact-table td:nth-child(2) {
  width: 33%;
}

.compact-table th:nth-child(3),
.compact-table td:nth-child(3) {
  width: 18%;
}

.compact-table th:nth-child(4),
.compact-table td:nth-child(4) {
  width: 18%;
}

.compact-table tbody tr:hover {
  background: #fafaf8;
}

.item-name {
  font-size: 13.5px;
  font-weight: 750;
  color: #222;
  line-height: 1.3;
}

.item-sub {
  margin-top: 4px;
  font-size: 11.5px;
  color: #999;
  line-height: 1.25;
}

.today-card .status-pill {
  height: 23px;
  padding: 0 10px;
  font-size: 11px;
  font-weight: 750;
}

/* =========================
   QUICK ACTIONS
========================= */
.rail-title {
  color: #777;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.quick-actions.compact {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
}

.qa-btn {
  min-height: 66px;
  padding: 12px 13px;
  border-radius: 16px;
  border: 1px solid #e8e8e3;
  background: #fbfbfa;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease,
    box-shadow 0.15s ease;
}

.qa-btn:hover {
  background: #fff;
  border-color: #d8d8d2;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.035);
}

.qa-btn:active {
  transform: scale(0.985);
}

.qa-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.qa-svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.qa-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  opacity: 0.9;
}

.qa-green {
  background: #f2faf0;
  color: #3d8b40;
}

.qa-blue {
  background: #f1f6ff;
  color: #3478bd;
}

.qa-amber {
  background: #fff7ea;
  color: #b47a2a;
}

.qa-purple {
  background: #f4f1ff;
  color: #6b61b8;
}

.qa-label {
  font-size: 13.5px;
  font-weight: 850;
  color: #222;
  line-height: 1.18;
}

.qa-desc {
  margin-top: 5px;
  font-size: 11.5px;
  color: #999;
  line-height: 1.3;
}

/* =========================
   LOW STOCK
========================= */
.stock-list {
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.stock-item {
  padding: 14px;
  border: 1px solid #eeeeea;
  border-radius: 16px;
  background: #fff;
}

.stock-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.stock-info {
  min-width: 0;
}

.stock-name {
  font-size: 13.5px;
  font-weight: 850;
  color: #222;
  line-height: 1.3;
}

.stock-min {
  margin-top: 4px;
  font-size: 11.8px;
  color: #888;
  line-height: 1.25;
}

.stock-right {
  text-align: right;
  white-space: nowrap;
  flex-shrink: 0;
}

.stock-qty {
  font-size: 12.8px;
  font-weight: 850;
  color: #d24b4b;
  line-height: 1.2;
}

.stock-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 6px;
  min-height: 21px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 750;
}

.badge-warn {
  background: #fff3df;
  color: #9b5d13;
}

.badge-crit {
  background: #ffecec;
  color: #c93434;
}

.stock-meter {
  height: 4px;
  margin-top: 11px;
  border-radius: 999px;
  background: #ededeb;
  overflow: hidden;
}

.stock-meter-fill {
  height: 100%;
  border-radius: 999px;
  background: #f0a33a;
}

.stock-meter-fill.critical {
  background: #ef5b5b;
}

/* =========================
   ONLINE REQUESTS
========================= */
.import-message {
  font-size: 12px;
  color: #2e7d32;
  background: #f0faf0;
  border: 1px solid #d8eddc;
  padding: 9px 11px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.online-request-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.online-request-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid #eeeeea;
  border-radius: 16px;
  background: #fff;
}

.or-content {
  min-width: 0;
}

.or-name {
  font-size: 13.5px;
  font-weight: 850;
  color: #222;
  line-height: 1.25;
}

.or-meta {
  margin-top: 4px;
  font-size: 11.8px;
  color: #777;
  line-height: 1.3;
}

.or-problem {
  margin-top: 6px;
  max-width: 240px;
  font-size: 11.8px;
  color: #999;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.or-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.or-status {
  height: 23px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f2f2f0;
  color: #777;
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 750;
  text-transform: capitalize;
  white-space: nowrap;
}

.or-convert-btn {
  border: none;
  background: #111;
  color: #fff;
  border-radius: 999px;
  padding: 7px 13px;
  font-size: 10.5px;
  font-weight: 850;
  cursor: pointer;
}

/* =========================
   RECENT ACTIVITY
========================= */
.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 13px 0;
  border-bottom: 1px solid #f1f1ee;
}

.activity-item:last-child {
  border-bottom: none;
}

.act-dot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 6px;
  flex-shrink: 0;
}

.act-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-green {
  background: #2fa36b;
}

.dot-blue {
  background: #2d7dd2;
}

.dot-amber {
  background: #e8912f;
}

.dot-purple {
  background: #7c3aed;
}

.act-line {
  width: 1px;
  min-height: 24px;
  flex: 1;
  margin-top: 6px;
  background: #eeeeea;
}

.activity-item:last-child .act-line {
  display: none;
}

.activity-content {
  min-width: 0;
}

.act-text {
  font-size: 13px;
  color: #444;
  line-height: 1.5;
}

.act-bold {
  font-weight: 750;
  color: #151515;
}

.act-time {
  margin-top: 4px;
  font-size: 11.5px;
  color: #999;
}

/* =========================
   OLD TABLE COMPATIBILITY
========================= */
.jobs-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.jobs-table th {
  text-align: left;
  padding: 10px;
  font-size: 10.5px;
  font-weight: 800;
  color: #999;
  text-transform: uppercase;
  border-bottom: 1px solid #eeeeea;
}

.jobs-table td {
  padding: 10px;
  font-size: 12.5px;
  color: #333;
  border-bottom: 1px solid #f3f3f0;
  vertical-align: middle;
}

.job-customer {
  font-weight: 700;
  color: #111;
  font-size: 12.5px;
}

.job-plate {
  font-size: 11px;
  color: #999;
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 1280px) {
  .dashboard-shell {
    grid-template-columns: minmax(0, 1fr) 390px;
    gap: 24px;
  }

  .main {
    padding: 32px;
  }
}

@media (max-width: 1200px) {
  .dashboard-shell {
    grid-template-columns: 1fr;
  }

  .dashboard-right-panel {
    padding-left: 0;
    border-left: none;
    background: transparent;
  }

  .dashboard-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .today-card,
  .activity-card,
  .quick-card,
  .low-stock-card,
  .online-card {
    height: auto;
    min-height: 220px;
  }

  .today-scroll,
  .activity-scroll,
  .stock-scroll,
  .online-scroll {
    max-height: 260px;
  }
}

@media (max-width: 700px) {
  .main {
    padding: 24px 16px;
  }

  .dashboard-hero {
    flex-direction: column;
    gap: 18px;
    margin-bottom: 22px;
  }

  .hero-title {
    font-size: 26px;
  }

  .hero-subtitle {
    font-size: 13px;
  }

  .hero-actions {
    width: 100%;
    justify-content: space-between;
  }

  .dashboard-main-panel,
  .dashboard-right-panel {
    gap: 18px;
  }

  .dashboard-metrics,
  .dashboard-metrics.staff-metrics,
  .quick-actions.compact {
    grid-template-columns: 1fr;
  }

  .metric-card {
    min-height: 105px;
  }
}
</style>

