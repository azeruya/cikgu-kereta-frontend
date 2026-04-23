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

      <div class="content-row-3">
        <Card>
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

            <tbody>
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

              <router-link to="/inventory" class="qa-btn">
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

          <Card>
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
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";
import Card from "../components/Card.vue";

export default {
  components: {
    Sidebar,
    Card,
  },

  data() {
    return {
      collapsed: false,
      menu: [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Expenses", path: "/expenses", icon: "alert" },
        { name: "Reports", path: "/reports", icon: "chart" },
      ],

      metrics: [
        {
          label: "TODAY'S REVENUE",
          value: "RM 2,850",
          sub: '<span class="metric-up">↑ 12%</span>&nbsp;vs yesterday',
          iconClass: "mi-green",
          icon: "↗",
        },
        {
          label: "ACTIVE INVOICES",
          value: "7",
          sub: "3 awaiting payment",
          iconClass: "mi-blue",
          icon: "≡",
        },
        {
          label: "PENDING RECEIPTS",
          value: "RM 4,120",
          sub: "From 6 transactions",
          iconClass: "mi-amber",
          icon: "◔",
        },
        {
          label: "LOW STOCK ALERTS",
          value: "5",
          sub: '<span class="metric-down">2 critical</span>',
          iconClass: "mi-red",
          icon: "!",
        },
      ],

      todayTransactions: [
        {
          id: 1,
          customer: "Hafiz Rahman",
          plate: "WPL 1234",
          work: "Engine service + oil",
          status: "Receipt",
          badgeClass: "sp-green",
          total: "RM 320",
        },
        {
          id: 2,
          customer: "Nurul Ain",
          plate: "VCG 8821",
          work: "Brake pad replacement",
          status: "Invoice",
          badgeClass: "sp-blue",
          total: "RM 180",
        },
        {
          id: 3,
          customer: "Rizwan Othman",
          plate: "BJG 4410",
          work: "AC gas top-up",
          status: "Invoice",
          badgeClass: "sp-blue",
          total: "RM 150",
        },
        {
          id: 4,
          customer: "Siti Mariam",
          plate: "PBM 5599",
          work: "Tyre rotation + alignment",
          status: "Quotation",
          badgeClass: "sp-amber",
          total: "RM 220",
        },
      ],

      weeklyRevenueTotal: "RM 14,240 this week",
      weeklyRevenue: [
        { label: "Mon", height: 52, isToday: false },
        { label: "Tue", height: 38, isToday: false },
        { label: "Wed", height: 65, isToday: false },
        { label: "Thu", height: 44, isToday: false },
        { label: "Fri", height: 28, isToday: false },
        { label: "Sat", height: 72, isToday: false },
        { label: "Sun", height: 48, isToday: true },
      ],

      lowStockItems: [
        { name: "Engine oil 5W-30 (1L)", min: 20, left: 3, level: "critical" },
        { name: "Oil filter — Toyota Vios", min: 10, left: 2, level: "critical" },
        { name: "Brake fluid DOT4 (500ml)", min: 15, left: 7, level: "low" },
        { name: "AC refrigerant R134a", min: 8, left: 5, level: "low" },
      ],

      recentActivity: [
        {
          text: '<span class="act-bold">Invoice #1041</span> marked as paid — <span class="act-bold">Hafiz Rahman</span>',
          time: "9:42 am",
          dotClass: "dot-green",
        },
        {
          text: 'New quotation created for <span class="act-bold">Siti Mariam</span>',
          time: "9:15 am",
          dotClass: "dot-blue",
        },
        {
          text: '<span class="act-bold">Engine oil 5W-30</span> dropped below minimum stock',
          time: "8:58 am",
          dotClass: "dot-amber",
        },
        {
          text: 'New customer registered — <span class="act-bold">Rizwan Othman</span>',
          time: "Yesterday, 4:12 pm",
          dotClass: "dot-purple",
        },
      ],
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
  },

  methods: {
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
}
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
  grid-template-columns: repeat(4, 1fr);
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