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
          <div class="page-eyebrow">{{ todayText }}</div>
          <h1 class="page-title">Dashboard</h1>
        </div>
        <div class="topbar-right">
          <router-link to="/transactions/new" class="btn-primary">
            + New transaction
          </router-link>
        </div>
      </div>

      <!-- METRICS -->
      <div class="metrics-grid" :class="{ 'staff-metrics': !isAdmin }">
        <div v-for="metric in metrics" :key="metric.label" class="metric-card">
          <div class="metric-accent" :class="metric.iconClass"></div>
          <div class="metric-label">{{ metric.label }}</div>
          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-sub" v-html="metric.sub"></div>
        </div>
      </div>

      <!-- SHELL: main + right rail -->
      <div class="dashboard-shell">

        <!-- LEFT -->
        <section class="dashboard-main">

          <!-- TODAY'S TRANSACTIONS -->
          <Card class="dash-card">
            <template #header>
              <span class="card-title">Today's transactions</span>
              <router-link to="/transactions" class="card-link">View all</router-link>
            </template>
            <div class="card-scroll">
              <table v-if="todayTransactions.length > 0" class="dash-table">
                <thead>
                  <tr>
                    <th>Customer / Plate</th>
                    <th>Work</th>
                    <th>Status</th>
                    <th class="col-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="job in todayTransactions" :key="job.id">
                    <td>
                      <div class="cell-primary">{{ job.customer }}</div>
                      <div class="cell-sub">{{ job.plate }}</div>
                    </td>
                    <td>
                      <div class="cell-primary">{{ job.work }}</div>
                    </td>
                    <td>
                      <span class="status-pill" :class="job.badgeClass">{{ job.status }}</span>
                    </td>
                    <td class="col-right cell-primary">{{ job.total }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="empty-line">No transactions today.</div>
            </div>
          </Card>

          <!-- RECENT ACTIVITY -->
          <Card class="dash-card">
            <template #header>
              <span class="card-title">Recent activity</span>
            </template>
            <div v-if="recentActivity.length === 0" class="empty-line">No recent activity yet.</div>
            <div v-else class="activity-list card-scroll">
              <div v-for="activity in recentActivity" :key="activity.text" class="activity-item">
                <div class="act-track">
                  <div class="act-dot" :class="activity.dotClass"></div>
                  <div class="act-line"></div>
                </div>
                <div class="activity-body">
                  <div class="act-text" v-html="activity.text"></div>
                  <div class="act-time">{{ activity.time }}</div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <!-- RIGHT RAIL -->
        <aside class="dashboard-rail">

          <!-- QUICK ACTIONS -->
          <Card class="dash-card">
            <template #header>
              <span class="card-title">Quick actions</span>
            </template>
            <div class="qa-grid">
              <router-link to="/transactions/new" class="qa-btn">
                <div class="qa-icon qa-green">
                  <svg class="qa-svg" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg>
                </div>
                <div>
                  <div class="qa-label">New transaction</div>
                  <div class="qa-desc">Create quotation or invoice</div>
                </div>
              </router-link>

              <router-link to="/inventory/new" class="qa-btn">
                <div class="qa-icon qa-blue">
                  <svg class="qa-svg" viewBox="0 0 16 16"><path d="M3 5.5L8 3l5 2.5v5L8 13l-5-2.5v-5Z"/><path d="M3 5.5L8 8l5-2.5"/><path d="M8 8v5"/></svg>
                </div>
                <div>
                  <div class="qa-label">Add part</div>
                  <div class="qa-desc">Create inventory part</div>
                </div>
              </router-link>

              <button class="qa-btn" type="button" :disabled="importingRequests" @click="importOnlineRequests">
                <div class="qa-icon qa-amber">
                  <svg class="qa-svg" viewBox="0 0 16 16"><path d="M8 11V4"/><path d="M5.5 6.5L8 4l2.5 2.5"/><path d="M3 11.5v1.5h10v-1.5"/></svg>
                </div>
                <div>
                  <div class="qa-label">Import</div>
                  <div class="qa-desc">{{ importingRequests ? 'Importing...' : 'Online requests' }}</div>
                </div>
              </button>

              <router-link v-if="isAdmin" to="/reports" class="qa-btn">
                <div class="qa-icon qa-red">
                  <svg class="qa-svg" viewBox="0 0 16 16"><path d="M3 13V8"/><path d="M8 13V4"/><path d="M13 13V6"/><path d="M2 13h12"/></svg>
                </div>
                <div>
                  <div class="qa-label">Reports</div>
                  <div class="qa-desc">View business report</div>
                </div>
              </router-link>

              <router-link v-else to="/customers" class="qa-btn">
                <div class="qa-icon qa-red">
                  <svg class="qa-svg" viewBox="0 0 16 16"><circle cx="8" cy="5" r="3"/><path d="M2.5 14c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/></svg>
                </div>
                <div>
                  <div class="qa-label">Customers</div>
                  <div class="qa-desc">View customer list</div>
                </div>
              </router-link>
            </div>
          </Card>

          <!-- LOW STOCK -->
          <Card class="dash-card">
            <template #header>
              <span class="card-title">Low stock</span>
              <router-link to="/inventory" class="card-link">View all</router-link>
            </template>
            <div v-if="lowStockItems.length === 0" class="empty-line">No low stock alerts.</div>
            <div v-else class="stock-list card-scroll">
              <div v-for="item in lowStockItems" :key="item.id || item.name" class="stock-item">
                <div class="stock-top">
                  <div class="stock-info">
                    <div class="stock-name">{{ item.name }}</div>
                    <div class="stock-min">Min {{ item.min }} · {{ item.left }} remaining</div>
                  </div>
                  <div class="stock-right">
                    <span class="stock-badge" :class="item.level === 'critical' ? 'badge-crit' : 'badge-warn'">
                      {{ item.level === 'critical' ? 'Critical' : 'Low' }}
                    </span>
                  </div>
                </div>
                <div class="stock-bar">
                  <div
                    class="stock-bar-fill"
                    :class="{ critical: item.level === 'critical' }"
                    :style="{ width: Math.max(0, Math.min(100, (Number(item.left || 0) / Math.max(Number(item.min || 1), 1)) * 100)) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          <!-- ONLINE REQUESTS -->
          <Card class="dash-card">
            <template #header>
              <span class="card-title">Online requests</span>
              <button class="card-link btn-reset" type="button" :disabled="importingRequests" @click="importOnlineRequests">
                {{ importingRequests ? 'Importing...' : 'Import' }}
              </button>
            </template>
            <div v-if="importMessage" class="import-msg">{{ importMessage }}</div>
            <div v-if="onlineRequests.length === 0" class="empty-line">No online requests.</div>
            <div v-else class="request-list card-scroll">
              <div v-for="request in onlineRequests" :key="request.id" class="request-item">
                <div class="req-body">
                  <div class="req-name">{{ request.customer?.name || request.customer_name || '-' }}</div>
                  <div class="req-meta">
                    {{ request.vehicle?.license_plate || request.license_plate || '-' }}
                    <span v-if="request.vehicle?.make || request.vehicle_make"> · {{ request.vehicle?.make || request.vehicle_make }}</span>
                    <span v-if="request.vehicle?.model || request.vehicle_model"> {{ request.vehicle?.model || request.vehicle_model }}</span>
                  </div>
                  <div class="req-problem">{{ request.problem_description || request.problem || 'No description' }}</div>
                </div>
                <div class="req-actions">
                  <span class="req-status">{{ request.status }}</span>
                  <button v-if="request.status !== 'converted'" class="req-convert-btn" type="button" @click="convertOnlineRequest(request)">
                    Convert
                  </button>
                </div>
              </div>
            </div>
          </Card>

        </aside>
      </div>

      <div v-if="error" class="page-error">{{ error }}</div>
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

.page-eyebrow {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 4px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.03em;
  margin: 0;
}

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
  transition: background 0.14s;
}

.btn-primary:hover { background: #991818; }

/* ── METRICS ── */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.staff-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-card {
  background: #fff;
  border: 0.5px solid #e4e4e0;
  border-radius: 12px;
  padding: 16px 16px 14px;
  position: relative;
  overflow: hidden;
}

.metric-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 12px 0 0 12px;
}

.mi-soft  { background: #aaa; }
.mi-green { background: #3B6D11; }
.mi-blue  { background: #185FA5; }
.mi-amber { background: #BA7517; }
.mi-red   { background: #B41C1C; }

.metric-label {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #888;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.04em;
  line-height: 1;
}

.metric-sub {
  margin-top: 6px;
  font-size: 11.5px;
  color: #999;
  line-height: 1.4;
}

/* ── SHELL ── */
.dashboard-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 20px;
  align-items: start;
}

.dashboard-main,
.dashboard-rail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.dashboard-rail {
  border-left: 1px solid #e8e8e4;
  padding-left: 20px;
}

/* ── CARDS ── */
.dash-card {
  background: #fff;
  border: 0.5px solid #e4e4e0;
  border-radius: 14px;
  overflow: hidden;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.card-link {
  font-size: 12px;
  color: #B41C1C;
  text-decoration: none;
  font-weight: 500;
}

.card-link:hover { text-decoration: underline; }

.btn-reset {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  font-size: 12px;
  color: #B41C1C;
  font-weight: 500;
}

.btn-reset:disabled { opacity: 0.45; cursor: not-allowed; }

.card-scroll {
  overflow-y: auto;
  max-height: 240px;
  scrollbar-width: thin;
  scrollbar-color: #e0e0da transparent;
}

.card-scroll::-webkit-scrollbar { width: 4px; }
.card-scroll::-webkit-scrollbar-thumb { background: #e0e0da; border-radius: 99px; }

.empty-line {
  padding: 18px 0 8px;
  font-size: 13px;
  color: #aaa;
  font-style: italic;
}

/* ── TABLE ── */
.dash-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

.dash-table th {
  padding: 9px 14px;
  text-align: left;
  font-size: 10.5px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  border-bottom: 0.5px solid #eeeee9;
  background: #fafaf8;
}

.dash-table td {
  padding: 11px 14px;
  border-bottom: 0.5px solid #f2f2ee;
  vertical-align: middle;
}

.dash-table tbody tr:last-child td { border-bottom: none; }
.dash-table tbody tr:hover td { background: #fafaf8; }

.col-right { text-align: right; }

.cell-primary {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
}

.cell-sub {
  margin-top: 3px;
  font-size: 11px;
  color: #aaa;
}

/* ── STATUS PILLS ── */
.status-pill {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
}

.pill-green,
.status-pill.receipt { background: #EAF3DE; color: #3B6D11; }
.pill-amber,
.status-pill.invoice { background: #FAEEDA; color: #854F0B; }
.pill-blue,
.status-pill.quotation { background: #E6F1FB; color: #185FA5; }
.pill-red { background: #FCEBEB; color: #A32D2D; }

/* ── ACTIVITY ── */
.activity-list { display: flex; flex-direction: column; }

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 0.5px solid #f1f1ee;
}

.activity-item:last-child { border-bottom: none; }

.act-track {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 5px;
  flex-shrink: 0;
}

.act-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green  { background: #3B6D11; }
.dot-blue   { background: #185FA5; }
.dot-amber  { background: #BA7517; }
.dot-purple { background: #7c3aed; }

.act-line {
  width: 1px;
  flex: 1;
  min-height: 20px;
  margin-top: 5px;
  background: #eeeee9;
}

.activity-item:last-child .act-line { display: none; }

.act-text {
  font-size: 13px;
  color: #444;
  line-height: 1.5;
}

.act-time {
  margin-top: 3px;
  font-size: 11px;
  color: #aaa;
}

/* ── QUICK ACTIONS ── */
.qa-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.qa-btn {
  padding: 11px 12px;
  border-radius: 11px;
  border: 0.5px solid #e8e8e4;
  background: #fafaf8;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: background 0.13s, border-color 0.13s;
  text-align: left;
  font: inherit;
}

.qa-btn:hover { background: #fff; border-color: #d8d8d2; }
.qa-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.qa-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.qa-green  { background: #EAF3DE; color: #3B6D11; }
.qa-blue   { background: #E6F1FB; color: #185FA5; }
.qa-amber  { background: #FAEEDA; color: #854F0B; }
.qa-red    { background: #FCEBEB; color: #B41C1C; }

.qa-svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.qa-label {
  font-size: 12.5px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.2;
}

.qa-desc {
  margin-top: 4px;
  font-size: 11px;
  color: #aaa;
  line-height: 1.3;
}

/* ── LOW STOCK ── */
.stock-list { display: flex; flex-direction: column; gap: 10px; }

.stock-item {
  padding: 12px 13px;
  border: 0.5px solid #eeeee9;
  border-radius: 10px;
  background: #fafaf8;
}

.stock-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 9px;
}

.stock-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
}

.stock-min {
  margin-top: 3px;
  font-size: 11px;
  color: #aaa;
}

.stock-badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 20px;
  font-size: 10.5px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-warn { background: #FAEEDA; color: #854F0B; }
.badge-crit { background: #FCEBEB; color: #A32D2D; }

.stock-bar {
  height: 3px;
  border-radius: 99px;
  background: #e8e8e4;
  overflow: hidden;
}

.stock-bar-fill {
  height: 100%;
  border-radius: 99px;
  background: #BA7517;
  transition: width 0.3s ease;
}

.stock-bar-fill.critical { background: #B41C1C; }

/* ── ONLINE REQUESTS ── */
.import-msg {
  font-size: 12px;
  color: #3B6D11;
  background: #EAF3DE;
  border: 0.5px solid #c0dd97;
  padding: 8px 11px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.request-list { display: flex; flex-direction: column; gap: 8px; }

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  border: 0.5px solid #eeeee9;
  border-radius: 10px;
  background: #fafaf8;
}

.req-name {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
}

.req-meta {
  margin-top: 3px;
  font-size: 11px;
  color: #888;
  line-height: 1.3;
}

.req-problem {
  margin-top: 4px;
  font-size: 11px;
  color: #bbb;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.req-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7px;
  flex-shrink: 0;
}

.req-status {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 9px;
  border-radius: 20px;
  background: #f2f2ef;
  color: #888;
  font-size: 10.5px;
  font-weight: 500;
  text-transform: capitalize;
  white-space: nowrap;
}

.req-convert-btn {
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: 20px;
  background: #111;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.13s;
}

.req-convert-btn:hover { background: #2a2a2a; }

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

/* ── RESPONSIVE ── */
@media (max-width: 1280px) {
  .dashboard-shell { grid-template-columns: minmax(0, 1fr) 320px; }
  .main { padding: 24px 24px 40px; }
}

@media (max-width: 1100px) {
  .dashboard-shell { grid-template-columns: 1fr; }
  .dashboard-rail { border-left: none; padding-left: 0; }
  .metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .main { padding: 20px 16px 40px; }
  .topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
  .metrics-grid,
  .staff-metrics { grid-template-columns: 1fr; }
  .qa-grid { grid-template-columns: 1fr; }
}
</style>

