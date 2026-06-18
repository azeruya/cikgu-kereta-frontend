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
          <!-- KPI CARDS -->
          <div
            class="dashboard-kpi-grid"
            :class="{ 'staff-metrics': !isAdmin }"
          >
            <div
              v-for="metric in metrics"
              :key="metric.label"
              class="dashboard-kpi-card"
            >
              <div class="kpi-top">
                <span class="kpi-label">{{ metric.label }}</span>

                <div class="kpi-icon" :class="metric.iconClass">
                  <span v-html="metric.icon"></span>
                </div>
              </div>

              <div class="kpi-value">
                {{ metric.value }}
              </div>

              <div class="kpi-sub" v-html="metric.sub"></div>
            </div>
          </div>

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

            <div class="quick-actions">
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

          <!-- LOW STOCK -->
          <Card class="dashboard-card low-stock-card">
            <template #header>
              <div>
                <span class="card-title">Low stock alerts</span>
                <p class="card-subtitle">Parts that need attention.</p>
              </div>

              <router-link to="/inventory" class="card-link">
                Inventory
              </router-link>
            </template>

            <div v-if="lowStockItems.length === 0" class="dashboard-empty-line">
              No low stock alerts.
            </div>

            <div v-else class="stock-list">
              <div
                v-for="item in lowStockItems"
                :key="item.id || item.name"
                class="stock-alert-item"
              >
                <div class="stock-alert-main">
                  <div>
                    <div class="stock-alert-name">{{ item.name }}</div>
                    <div class="stock-alert-meta">
                      {{ item.left }} in stock · Minimum {{ item.min }}
                    </div>
                  </div>

                  <span
                    class="stock-alert-pill"
                    :class="{ critical: item.level === 'critical' }"
                  >
                    {{ item.level === "critical" ? "Critical" : "Low" }}
                  </span>
                </div>

                <router-link to="/inventory" class="stock-alert-action">
                  Manage stock
                </router-link>
              </div>
            </div>
          </Card>

          <!-- ONLINE REQUESTS -->
          <Card class="dashboard-card online-card">
            <template #header>
              <div>
                <span class="card-title">Online requests</span>
                <p class="card-subtitle">Latest imported requests.</p>
              </div>

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

            <div v-else class="online-request-list">
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
                </div>

                <div class="or-actions">
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
  padding: 32px 38px 42px;
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
  gap: 24px;
  margin-bottom: 22px;
}

.hero-copy {
  min-width: 0;
}

.hero-title {
  margin: 0;
  font-size: 28px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.05;
  letter-spacing: -0.055em;
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 0;
  font-size: 11px;
  font-weight: 800;
  color: #7c8798;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-meta span {
  color: #c4ccd8;
}

.hero-subtitle {
  margin: 7px 0 0;
  font-size: 13.5px;
  color: #8a96a8;
  line-height: 1.45;
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
  grid-template-columns: minmax(0, 1fr) 350px;
  gap: 20px;
  align-items: start;
}

.dashboard-main-panel {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dashboard-right-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  position: sticky;
  top: 24px;
}

.dashboard-work-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: 16px;
  align-items: stretch;
}

.dashboard-card {
  overflow: hidden;
}

.dashboard-card :deep(.card-header),
.dashboard-card :deep(.card-head) {
  align-items: flex-start;
  margin-bottom: 14px;
}

.card-title {
  font-size: 13.5px;
  font-weight: 850;
  color: #0f172a;
}

.card-subtitle {
  margin: 4px 0 0;
  font-size: 12.2px;
  font-weight: 500;
  color: #8a96a8;
  line-height: 1.35;
}

.card-link,
.btn-link {
  font-size: 12.2px;
  font-weight: 750;
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
   KPI ROW
========================= */
.dashboard-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.dashboard-kpi-grid.staff-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.dashboard-kpi-card {
  min-height: 92px;
  padding: 14px 15px;
  border: 1px solid #dfe5ee;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.032);
}

.kpi-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.kpi-label {
  max-width: 118px;
  font-size: 10px;
  font-weight: 850;
  color: #7c8798;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  line-height: 1.25;
}

.kpi-icon {
  width: 31px;
  height: 31px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-value {
  font-size: 22px;
  font-weight: 850;
  color: #0f172a;
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.kpi-sub {
  margin-top: 7px;
  font-size: 11.8px;
  color: #8a96a8;
  line-height: 1.3;
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
   WORK AREA
========================= */
.dashboard-work-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: 18px;
  align-items: stretch;
}

.today-card,
.activity-card {
  min-height: 365px;
}

.today-body {
  min-height: 265px;
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

.dashboard-empty-line {
  padding: 12px 0 4px;
  font-size: 12.8px;
  color: #8a96a8;
  font-style: italic;
}

.dashboard-empty-state {
  min-height: 260px;
  border: 1px dashed #dfe5ee;
  border-radius: 16px;
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
  border-radius: 13px;
  background: #f3f6fa;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.dashboard-empty-state strong {
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
}

.dashboard-empty-state span {
  max-width: 320px;
  margin-bottom: 6px;
  font-size: 12.5px;
  color: #8a96a8;
  line-height: 1.45;
}

.dashboard-right-panel .dashboard-card :deep(.card-body),
.dashboard-right-panel .dashboard-card :deep(.card-content) {
  padding-top: 0;
}

.low-stock-card,
.online-card,
.quick-card {
  min-height: auto;
}

/* =========================
   ACTIVITY
========================= */
.activity-list {
  max-height: 335px;
  overflow-y: auto;
  padding-right: 6px;
}

.activity-list::-webkit-scrollbar,
.online-request-list::-webkit-scrollbar,
.stock-list::-webkit-scrollbar {
  width: 5px;
}

.activity-list::-webkit-scrollbar-thumb,
.online-request-list::-webkit-scrollbar-thumb,
.stock-list::-webkit-scrollbar-thumb {
  background: #dfe5ee;
  border-radius: 999px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #edf1f6;
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
  min-height: 22px;
  flex: 1;
  margin-top: 6px;
  background: #e5eaf1;
}

.activity-item:last-child .act-line {
  display: none;
}

.activity-content {
  min-width: 0;
}

.act-text {
  font-size: 12.8px;
  color: #526173;
  line-height: 1.45;
}

.act-bold {
  font-weight: 800;
  color: #0f172a;
}

.act-time {
  margin-top: 4px;
  font-size: 11.5px;
  color: #8a96a8;
}

/* =========================
   QUICK ACTIONS
========================= */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qa-btn {
  min-height: 52px;
  padding: 10px 11px;
  border-radius: 14px;
  border: 1px solid #dfe5ee;
  background: #fbfcfe;
  display: flex;
  align-items: center;
  gap: 11px;
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
  width: 31px;
  height: 31px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qa-label {
  font-size: 12.8px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.2;
}

.qa-desc {
  margin-top: 3px;
  font-size: 11.4px;
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
   LOW STOCK ALERTS
========================= */
.stock-list {
  max-height: 230px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}

.stock-alert-item {
  padding: 11px;
  border: 1px solid #dfe5ee;
  border-radius: 14px;
  background: #fbfcfe;
}

.stock-alert-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.stock-alert-name {
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.25;
}

.stock-alert-meta {
  margin-top: 4px;
  font-size: 11.8px;
  font-weight: 650;
  color: #8a96a8;
}

.stock-alert-pill {
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid #fed7aa;
  background: #fff7ed;
  color: #c2410c;
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 850;
  white-space: nowrap;
}

.stock-alert-pill.critical {
  border-color: #fecaca;
  background: #fff1f2;
  color: #dc2626;
}

.stock-alert-action {
  height: 32px;
  margin-top: 10px;
  border-radius: 11px;
  border: 1px solid #dfe5ee;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11.8px;
  font-weight: 800;
  color: #475569;
  text-decoration: none;
}

.stock-alert-action:hover {
  border-color: #cfd8e6;
  color: #0f172a;
}

/* =========================
   ONLINE REQUESTS
========================= */
.import-message {
  margin-bottom: 10px;
  padding: 9px 11px;
  border-radius: 12px;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
  font-size: 12px;
  font-weight: 650;
}

.online-request-list {
  max-height: 240px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
}

.online-request-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 13px;
  border: 1px solid #dfe5ee;
  border-radius: 15px;
  background: #fbfcfe;
}

.or-content {
  min-width: 0;
}

.or-name {
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.25;
}

.or-meta {
  margin-top: 4px;
  font-size: 11.8px;
  color: #8a96a8;
  line-height: 1.35;
}

.or-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.or-convert-btn {
  height: 28px;
  padding: 0 11px;
  border: none;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 11px;
  font-weight: 850;
  cursor: pointer;
}

/* =========================
   RESPONSIVE
========================= */
@media (max-width: 1280px) {
  .main {
    padding: 30px 32px 40px;
  }

  .dashboard-shell {
    grid-template-columns: minmax(0, 1fr) 340px;
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

  .dashboard-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
    font-size: 26px;
  }

  .hero-actions {
    width: 100%;
    justify-content: space-between;
  }

  .dashboard-kpi-grid,
  .dashboard-kpi-grid.staff-metrics,
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>