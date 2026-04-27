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
            Good {{ greeting }}, {{ firstName }}
          </div>
          <div class="page-date">
            {{ todayText }}
            &nbsp;·&nbsp;
            <span class="inline-status">
              <span class="status-dot"></span>
              Workshop is open
            </span>
          </div>
        </div>

        <div class="top-right">
          <button class="pill-btn">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2" />
              <path d="M6 3v3l2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
            </svg>
            Today
          </button>

          <router-link to="/transactions/new" class="pill-btn primary link-btn">
            + New Transaction
          </router-link>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card" v-for="metric in metrics" :key="metric.label">
          <div class="metric-label">
            {{ metric.label }}
            <div class="metric-icon" :class="metric.iconClass">
              <span v-html="metric.icon"></span>
            </div>
          </div>

          <div class="metric-value">{{ metric.value }}</div>
          <div class="metric-sub" v-html="metric.sub"></div>
        </div>
      </div>

      <div class="content-row-3" :class="{ 'staff-layout': !isAdmin }">
        <Card class="today-card">
          <template #header>
            <span class="card-title">Today's transactions</span>
            <router-link to="/transactions" class="card-link">View all</router-link>
          </template>

          <table class="jobs-table">
            <thead>
              <tr>
                <th>Customer / Plate</th>
                <th>Work</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>

            <tbody v-if="todayTransactions.length > 0">
              <tr v-for="job in todayTransactions" :key="job.id">
                <td>
                  <div class="job-customer">{{ job.customer }}</div>
                  <div class="job-plate">{{ job.plate }}</div>
                </td>
                <td>{{ job.work }}</td>
                <td>
                  <span class="status-pill" :class="job.badgeClass">
                    {{ job.status }}
                  </span>
                </td>
                <td>{{ job.total }}</td>
              </tr>
            </tbody>
          </table>
           <div v-if="!loading && todayTransactions.length === 0" class="empty-state today-empty">
            No transactions today.
            </div>
        </Card>

        <div class="stack-col">
          <Card>
            <template #header>
              <span class="card-title">Quick actions</span>
            </template>

            <div class="quick-actions">
              <router-link to="/transactions/new" class="qa-btn">
                <div class="qa-icon qa-green">+</div>
                <div class="qa-label">New transaction</div>
                <div class="qa-desc">Create quotation or invoice</div>
              </router-link>

              <router-link to="/customers" class="qa-btn">
                <div class="qa-icon qa-purple">👤</div>
                <div class="qa-label">Add customer</div>
                <div class="qa-desc">Register new customer</div>
              </router-link>

              <router-link to="/inventory/new" class="qa-btn">
                <div class="qa-icon qa-blue">📦</div>
                <div class="qa-label">Inventory</div>
                <div class="qa-desc">Manage parts & stock</div>
              </router-link>

              <router-link to="/expenses" class="qa-btn">
                <div class="qa-icon qa-amber">💳</div>
                <div class="qa-label">Add expense</div>
                <div class="qa-desc">Log operating expense</div>
              </router-link>
            </div>
          </Card>

          <Card v-if="isAdmin">
          <template #header>
            <span class="card-title">Weekly revenue</span>
            <span class="card-link">{{ weeklyRevenueTotal }}</span>
          </template>

          <div class="chart-bars">
            <div
              v-for="day in weeklyRevenue"
              :key="day.label"
              class="chart-bar-wrap"
            >
              <div
                class="chart-bar"
                :class="{ today: day.isToday }"
                :style="{ height: day.height + 'px' }"
              ></div>
              <div class="chart-day" :class="{ 'chart-day-active': day.isToday }">
                {{ day.label }}
              </div>
            </div>
          </div>
        </Card>

        <Card v-if="!isAdmin">
          <template #header>
            <span class="card-title">Staff focus</span>
          </template>

          <div class="staff-focus">
            <div class="focus-row">
              <span>Today’s transactions</span>
              <b>{{ todayTransactions.length }}</b>
            </div>
            <div class="focus-row">
              <span>Invoices awaiting payment</span>
              <b>{{ summary.active_invoices }}</b>
            </div>
            <div class="focus-row">
              <span>Low stock items</span>
              <b>{{ summary.low_stock_count }}</b>
            </div>
          </div>
        </Card>
        </div>
      </div>

      <div class="content-row">
        <Card>
          <template #header>
            <span class="card-title">Low stock alerts</span>
            <router-link to="/inventory" class="card-link">View inventory</router-link>
          </template>

          <div class="stock-list">
            <div
              v-for="item in lowStockItems"
              :key="item.name"
              class="stock-item"
              :class="{ critical: item.level === 'critical' }"
            >
              <div>
                <div class="stock-name">{{ item.name }}</div>
                <div class="stock-min">Min stock: {{ item.min }} units</div>
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
            <div v-if="lowStockItems.length === 0" class="empty-state">
            No low stock alerts.
            </div>
          </div>
        </Card>

        <Card>
          <template #header>
            <span class="card-title">Recent activity</span>
            <span class="card-link">Latest updates</span>
          </template>

          <div class="activity-list">
            <div
              v-for="activity in recentActivity"
              :key="activity.text"
              class="activity-item"
            >
              <div class="act-dot-wrap">
                <div class="act-dot" :class="activity.dotClass"></div>
                <div class="act-line"></div>
              </div>

              <div>
                <div class="act-text" v-html="activity.text"></div>
                <div class="act-time">{{ activity.time }}</div>
              </div>
            </div>
            <div v-if="recentActivity.length === 0" class="empty-state">
            No recent activity yet.
            </div>
          </div>
        </Card>
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
      collapsed: false,
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
          iconClass: "mi-green",
          icon: "↗",
        });
      }

      baseMetrics.push(
        {
          label: "ACTIVE INVOICES",
          value: this.summary.active_invoices,
          sub: "Awaiting payment",
          iconClass: "mi-blue",
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
          iconClass: "mi-amber",
          icon: "◔",
        },
        {
          label: "LOW STOCK ALERTS",
          value: this.summary.low_stock_count,
          sub: `<span class="metric-down">${this.summary.critical_stock_count} critical</span>`,
          iconClass: "mi-red",
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
          firstItem?.item_name ||
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
.main {
  padding: 28px;
}

.inline-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.metric-card {
  background: #fff;
  border: 1px solid #e8e8e6;
  border-radius: 12px;
  padding: 16px 18px;
}

.metric-label {
  font-size: 11px;
  color: #999;
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.metric-value {
  font-size: 22px;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.5px;
  line-height: 1;
}

.metric-sub {
  font-size: 11px;
  color: #999;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.mi-green { background: #f0faf0; color: #2e7d32; }
.mi-blue { background: #eef4ff; color: #1565c0; }
.mi-amber { background: #fff8ee; color: #e57320; }
.mi-red { background: #fff0f0; color: #e53935; }

.content-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.content-row-3 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.content-row-3.staff-layout {
  grid-template-columns: 1.45fr 0.85fr;
}

.content-row-3.staff-layout .today-card {
  min-height: 340px;
}

.stack-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.qa-btn {
  background: #f9f9f8;
  border: 1px solid #e8e8e6;
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.12s;
  text-align: left;
  text-decoration: none;
  color: inherit;
}

.qa-btn:hover {
  background: #f0f0ee;
  border-color: #d8d8d4;
}

.qa-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.qa-green { background: #f0faf0; color: #2e7d32; }
.qa-blue { background: #eef4ff; color: #1565c0; }
.qa-amber { background: #fff8ee; color: #e57320; }
.qa-purple { background: #f5f0ff; color: #7c3aed; }

.qa-label {
  font-size: 12px;
  font-weight: 500;
  color: #111;
}

.qa-desc {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 5px;
  height: 80px;
  margin-top: 8px;
}

.chart-bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.chart-bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  background: #e8e8e6;
  min-height: 4px;
}

.chart-bar.today {
  background: #141414;
}

.chart-day {
  font-size: 9px;
  color: #bbb;
}

.chart-day-active {
  color: #111;
  font-weight: 500;
}

.stock-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stock-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff8f0;
  border: 1px solid #ffe0c0;
}

.stock-item.critical {
  background: #fff0f0;
  border-color: #ffcccc;
}

.stock-name {
  font-size: 12px;
  font-weight: 500;
  color: #111;
}

.stock-min {
  font-size: 10px;
  color: #bbb;
}

.stock-right {
  text-align: right;
}

.stock-qty {
  font-size: 11px;
  color: #e57320;
  font-weight: 600;
}

.stock-item.critical .stock-qty {
  color: #e53935;
}

.stock-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.badge-warn {
  background: #fff3e0;
  color: #e57320;
}

.badge-crit {
  background: #ffebee;
  color: #e53935;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f2f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.act-dot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 3px;
}

.act-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-green { background: #4caf50; }
.dot-blue { background: #1565c0; }
.dot-amber { background: #e57320; }
.dot-purple { background: #7c3aed; }

.act-line {
  width: 1px;
  height: 100%;
  background: #f0f0ee;
  margin-top: 4px;
  flex: 1;
  min-height: 16px;
}

.activity-item:last-child .act-line {
  display: none;
}

.act-text {
  font-size: 12px;
  color: #555;
  line-height: 1.5;
}

.act-bold {
  font-weight: 500;
  color: #111;
}

.act-time {
  font-size: 11px;
  color: #bbb;
  margin-top: 2px;
}

.job-customer {
  font-weight: 500;
  color: #111;
  font-size: 12px;
}

.job-plate {
  font-size: 11px;
  color: #999;
}

.link-btn {
  text-decoration: none;
}

.jobs-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.jobs-table th {
  text-align: left;
  padding: 12px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  border-bottom: 1px solid #eeeeea;
}

.jobs-table td {
  padding: 14px 10px;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #f3f3f0;
  vertical-align: middle;
}

.jobs-table th:nth-child(1),
.jobs-table td:nth-child(1) {
  width: 30%;
}

.jobs-table th:nth-child(2),
.jobs-table td:nth-child(2) {
  width: 34%;
}

.jobs-table th:nth-child(3),
.jobs-table td:nth-child(3) {
  width: 18%;
}

.jobs-table th:nth-child(4),
.jobs-table td:nth-child(4) {
  width: 18%;
  text-align: right;
}

.jobs-table tbody tr:hover {
  background: #fafaf8;
}

.today-card {
  min-height: 380px;
}

.today-empty {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.staff-focus {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.focus-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 13px;
  border-bottom: 1px solid #f2f2f0;
}

.focus-row:last-child {
  border-bottom: none;
}

.focus-row span {
  color: #777;
}

.focus-row b {
  color: #111;
}

@media (max-width: 1200px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-row,
  .content-row-3 {
    grid-template-columns: 1fr;
  }
}
</style>