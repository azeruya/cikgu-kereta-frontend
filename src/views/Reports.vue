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
      <div class="top-bar">
        <div class="page-intro">
          <div class="page-title-row">
            <div class="page-title">Reports</div>
            <span class="page-chip">{{ periodChartRaw.length || 0 }} period records</span>
          </div>

          <div class="page-date">
            Financial overview and business analytics
          </div>
        </div>

        <div class="top-right">
          <input
            class="search"
            v-model.trim="searchQuery"
            placeholder="Search customer / plate / make / model..."
          />
          <button class="pill-btn" type="button" @click="applyFilters">
            Refresh
          </button>
        </div>
      </div>

      <div class="report-filter-card">
        <div class="filter-left">
          <div class="filter-title">Filters</div>
          <div class="filter-subtitle">
            Narrow reports by date, transaction status, or payment status
          </div>
        </div>

        <div class="report-filters">
          <input type="date" v-model="startDate" />
          <input type="date" v-model="endDate" />

          <select v-model="statusFilter">
            <option value="">All statuses</option>
            <option value="quotation">Quotation</option>
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
          </select>

          <select v-model="paymentStatusFilter">
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
          </select>

          <button class="filter-btn primary btn btn-primary" type="button" @click="applyFilters">
            Apply
          </button>

          <button class="filter-btn btn btn-secondary" type="button" @click="clearFilters">
            Reset
          </button>
        </div>
      </div>

      <!-- Hero -->
      <div class="report-layout">
        <!-- Main column -->
        <div class="report-main">
          <Card class="financial-card">
            <template #header>
              <span class="card-title">Financial Overview</span>
              <span class="card-link">{{ periodChartRaw.length || 0 }} period(s)</span>
            </template>

            <div class="report-kpis">
              <div class="report-kpi">
                <span>Total Revenue</span>
                <strong>RM {{ formatMoney(summary.total_revenue) }}</strong>
              </div>

              <div class="report-kpi">
                <span>Total Expenses</span>
                <strong>RM {{ formatMoney(summary.total_expenses) }}</strong>
              </div>

              <div class="report-kpi">
                <span>Estimated Profit</span>
                <strong :class="Number(summary.estimated_profit) < 0 ? 'danger-text' : ''">
                  RM {{ formatMoney(summary.estimated_profit) }}
                </strong>
              </div>
            </div>

            <div v-if="loading" class="empty-state">Loading report...</div>

            <div v-else-if="periodChartRaw.length === 0" class="empty-state">
              No chart data found.
            </div>

            <div v-else class="apex-chart-wrap financial-chart">
              <apexchart
                type="line"
                height="260"
                :options="financialChartOptions"
                :series="financialChartSeries"
              />
            </div>
          </Card>

          <div class="analytics-grid">
            <Card class="analytics-card">
              <template #header>
                <span class="card-title">Revenue by Make</span>
              </template>

              <div v-if="revenueByMake.length === 0" class="empty-small">
                No make analytics found.
              </div>

              <div v-else class="apex-chart-wrap medium-chart">
                <apexchart
                  type="bar"
                  height="230"
                  :options="makeChartOptions"
                  :series="makeChartSeries"
                />
              </div>
            </Card>

            <Card class="analytics-card">
              <template #header>
                <span class="card-title">Revenue by Model</span>
              </template>

              <div v-if="revenueByModel.length === 0" class="empty-small">
                No model analytics found.
              </div>

              <div v-else class="apex-chart-wrap medium-chart">
                <apexchart
                  type="bar"
                  height="230"
                  :options="modelChartOptions"
                  :series="modelChartSeries"
                />
              </div>
            </Card>
          </div>

          <div class="analytics-grid">
            <Card>
              <template #header>
                <span class="card-title">Top Customers</span>
                <span class="card-link">{{ customerAnalytics.unique_customers || 0 }} unique</span>
              </template>

              <div class="insight-stats">
                <div class="insight-stat">
                  <span>Unique Customers</span>
                  <strong>{{ customerAnalytics.unique_customers || 0 }}</strong>
                </div>

                <div class="insight-stat">
                  <span>Repeat Customers</span>
                  <strong>{{ customerAnalytics.repeat_customers || 0 }}</strong>
                </div>
              </div>

              <div
                v-if="!customerAnalytics.top_customers || customerAnalytics.top_customers.length === 0"
                class="empty-small"
              >
                No customer analytics found.
              </div>

              <div v-else class="report-list">
                <div
                  v-for="row in customerAnalytics.top_customers"
                  :key="row.id"
                  class="report-list-row"
                >
                  <div>
                    <div class="item-name">{{ row.name }}</div>
                    <div class="subtext">{{ row.transactions_count }} transaction(s)</div>
                  </div>

                  <div class="job-price">RM {{ formatMoney(row.revenue) }}</div>
                </div>
              </div>
            </Card>

            <Card>
              <template #header>
                <span class="card-title">Top Vehicles</span>
                <span class="card-link">{{ vehicleAnalytics.unique_vehicles || 0 }} unique</span>
              </template>

              <div
                v-if="!vehicleAnalytics.top_vehicles || vehicleAnalytics.top_vehicles.length === 0"
                class="empty-small"
              >
                No vehicle analytics found.
              </div>

              <div v-else class="report-list">
                <div
                  v-for="row in vehicleAnalytics.top_vehicles"
                  :key="row.id"
                  class="report-list-row"
                >
                  <div>
                    <div class="item-name">
                      {{ row.license_plate }} — {{ row.make }} {{ row.model }}
                    </div>

                    <div class="subtext">
                      {{ row.year || "-" }} · {{ row.transactions_count }} transaction(s)
                    </div>
                  </div>

                  <div class="job-price">RM {{ formatMoney(row.revenue) }}</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <!-- Right column -->
        <div class="report-side">
          <Card class="collection-card">
            <template #header>
              <span class="card-title">Collection Status</span>
            </template>

            <div class="ring-shell apex-chart-wrap small-chart">
              <apexchart
                type="radialBar"
                height="150"
                :options="paidStatusChartOptions"
                :series="paidStatusChartSeries"
              />
            </div>

            <div class="summary-stack compact">
              <div class="summary-line">
                <span>Paid</span>
                <b>RM {{ formatMoney(paidVsUnpaid.paid) }}</b>
              </div>

              <div class="summary-line">
                <span>Unpaid</span>
                <b>RM {{ formatMoney(paidVsUnpaid.unpaid) }}</b>
              </div>
            </div>
          </Card>

          <Card>
            <template #header>
              <span class="card-title">Quick Overview</span>
            </template>

            <div class="mini-stat-list">
              <div class="mini-stat-row">
                <span>Total Transactions</span>
                <b>{{ summary.total_transactions }}</b>
              </div>

              <div class="mini-stat-row">
                <span>Total Paid</span>
                <b>RM {{ formatMoney(summary.total_paid) }}</b>
              </div>

              <div class="mini-stat-row">
                <span>Total Unpaid</span>
                <b>RM {{ formatMoney(summary.total_unpaid) }}</b>
              </div>

              <div class="mini-stat-row">
                <span>Gross Sales</span>
                <b>RM {{ formatMoney(summary.gross_sales) }}</b>
              </div>

              <div class="mini-stat-row">
                <span>Discounts</span>
                <b>RM {{ formatMoney(summary.total_discount) }}</b>
              </div>
            </div>
          </Card>
        </div>
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
import VueApexCharts from "vue3-apexcharts";
import api from "../services/api";

export default {
  name: "Reports",
  components: {
    Sidebar,
    Card,
    apexchart: VueApexCharts,
  },

  data() {
    return {
      collapsed: localStorage.getItem("sidebar-collapsed") === "true",
      loading: false,
      error: "",

      searchQuery: "",
      statusFilter: "",
      paymentStatusFilter: "",
      startDate: "",
      endDate: "",

      summary: {
        total_transactions: 0,
        gross_sales: 0,
        total_discount: 0,
        total_revenue: 0,
        total_expenses: 0,
        estimated_profit: 0,
        total_paid: 0,
        total_unpaid: 0,
      },

      paidVsUnpaid: {
        paid: 0,
        unpaid: 0,
      },

      periodChartRaw: [],
      revenueByMake: [],
      revenueByModel: [],
      customerAnalytics: {
        unique_customers: 0,
        repeat_customers: 0,
        top_customers: [],
      },
      vehicleAnalytics: {
        unique_vehicles: 0,
        top_vehicles: [],
      },
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

  paidPercentage() {
    const paid = Number(this.paidVsUnpaid.paid || 0);
    const unpaid = Number(this.paidVsUnpaid.unpaid || 0);
    const total = paid + unpaid;
    if (!total) return 0;
    return (paid / total) * 100;
  },

  financialChartSeries() {
    return [
      {
        name: "Revenue",
        type: "column",
        data: this.periodChartRaw.map((row) => Number(row.revenue || 0)),
      },
      {
        name: "Expenses",
        type: "column",
        data: this.periodChartRaw.map((row) => Number(row.expense || 0)),
      },
      {
        name: "Profit",
        type: "line",
        data: this.periodChartRaw.map((row) => Number(row.profit || 0)),
      },
    ];
  },

  financialChartOptions() {
    return {
      chart: {
        type: "line",
        stacked: false,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      stroke: {
        width: [0, 0, 3],
        curve: "smooth",
      },
      plotOptions: {
        bar: {
          columnWidth: "38%",
          borderRadius: 8,
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontSize: "12px",
      },
      xaxis: {
        categories: this.periodChartRaw.map((row) => row.label),
        labels: {
          style: {
            colors: "#888",
            fontSize: "11px",
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (value) => `RM ${this.shortMoney(value)}`,
          style: {
            colors: "#888",
            fontSize: "11px",
          },
        },
      },
      grid: {
        borderColor: "#efefeb",
        strokeDashArray: 4,
      },
      tooltip: {
        y: {
          formatter: (value) => `RM ${Number(value || 0).toFixed(2)}`,
        },
      },
      colors: ["#111111", "#9a9a9a", "#2f8f4e"],
    };
  },

  paidStatusChartSeries() {
    return [Number(this.paidPercentage.toFixed(1))];
  },

  paidStatusChartOptions() {
    return {
      chart: {
        type: "radialBar",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: {
            size: "62%",
          },
          track: {
            background: "#efefeb",
            strokeWidth: "100%",
          },
          dataLabels: {
            name: {
              show: true,
              offsetY: 18,
              color: "#888",
              fontSize: "12px",
            },
            value: {
              show: true,
              offsetY: -10,
              fontSize: "28px",
              fontWeight: 700,
              formatter: (val) => `${Number(val).toFixed(0)}%`,
            },
          },
        },
      },
      labels: ["Paid"],
      colors: ["#111111"],
    };
  },

  makeChartSeries() {
    return [
      {
        name: "Revenue",
        data: this.revenueByMake.map((row) => Number(row.revenue || 0)),
      },
    ];
  },

  makeChartOptions() {
    return {
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: "50%",
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: this.revenueByMake.map((row) => row.make),
        labels: {
          formatter: (value) => `RM ${this.shortMoney(value)}`,
          style: {
            colors: "#888",
            fontSize: "11px",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#444",
            fontSize: "12px",
          },
        },
      },
      grid: {
        borderColor: "#efefeb",
        strokeDashArray: 4,
      },
      tooltip: {
        y: {
          formatter: (value) => `RM ${Number(value || 0).toFixed(2)}`,
        },
      },
      colors: ["#111111"],
    };
  },

  modelChartSeries() {
    return [
      {
        name: "Revenue",
        data: this.revenueByModel.map((row) => Number(row.revenue || 0)),
      },
    ];
  },

  modelChartOptions() {
    return {
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: "Inter, system-ui, sans-serif",
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: "50%",
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: this.revenueByModel.map((row) => row.model),
        labels: {
          formatter: (value) => `RM ${this.shortMoney(value)}`,
          style: {
            colors: "#888",
            fontSize: "11px",
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#444",
            fontSize: "12px",
          },
        },
      },
      grid: {
        borderColor: "#efefeb",
        strokeDashArray: 4,
      },
      tooltip: {
        y: {
          formatter: (value) => `RM ${Number(value || 0).toFixed(2)}`,
        },
      },
      colors: ["#6f6f6f"],
    };
  },
},

  mounted() {
    this.fetchReports();
  },

  methods: {
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

    getReportCacheKey() {
      return `reports-chart-${JSON.stringify({
        search: this.searchQuery || "",
        status: this.statusFilter || "",
        payment_status: this.paymentStatusFilter || "",
        start_date: this.startDate || "",
        end_date: this.endDate || "",
      })}`;
    },

    clearReportCache() {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("reports-chart-"))
        .forEach((k) => sessionStorage.removeItem(k));
    },

    applyFilters() {
      this.clearReportCache();
      this.fetchReports();
    },

    async fetchReports() {
      const cacheKey = this.getReportCacheKey();
      const cached = sessionStorage.getItem(cacheKey);

      this.error = "";

      if (cached) {
        const parsed = JSON.parse(cached);
        this.applyResponseData(parsed);
      } else {
        this.loading = true;
      }

      try {
        const { data } = await api.get("/reports", {
          params: {
            search: this.searchQuery || undefined,
            status: this.statusFilter || undefined,
            payment_status: this.paymentStatusFilter || undefined,
            start_date: this.startDate || undefined,
            end_date: this.endDate || undefined,
            per_page: 5,
          },
        });

        this.applyResponseData(data);
        sessionStorage.setItem(cacheKey, JSON.stringify(data));
      } catch (error) {
        console.error("Error fetching reports:", error);
        this.error = error.response?.data?.message || "Failed to load reports.";
      } finally {
        this.loading = false;
      }
    },

    applyResponseData(data) {
      this.summary = data.summary || this.summary;
      this.paidVsUnpaid = data.paid_vs_unpaid || this.paidVsUnpaid;
      this.periodChartRaw = data.period_chart || [];
      this.revenueByMake = data.revenue_by_make || [];
      this.revenueByModel = data.revenue_by_model || [];
      this.customerAnalytics = data.customer_analytics || this.customerAnalytics;
      this.vehicleAnalytics = data.vehicle_analytics || this.vehicleAnalytics;
    },

    clearFilters() {
      this.searchQuery = "";
      this.statusFilter = "";
      this.paymentStatusFilter = "";
      this.startDate = "";
      this.endDate = "";
      this.clearReportCache();
      this.fetchReports();
    },

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    shortMoney(value) {
      const num = Number(value || 0);
      if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}k`;
      return num.toFixed(0);
    },
  },

  watch: {
    searchQuery() {
      this.fetchReports();
    },
  },
};
</script>

<style scoped>
.item-name {
  font-weight: 600;
  font-size: 13px;
}

.card {
  transition: all 0.15s ease;
}

.card:hover {
  transform: translateY(-2px);
}

.apex-chart-wrap {
  width: 100%;
}

.small-chart {
  min-height: 150px;
}

.medium-chart {
  min-height: 280px;
}

.filter-shell {
  margin-bottom: 16px;
}

.mini-stat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mini-stat-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f1f1ee;
  font-size: 13px;
}

.mini-stat-row:last-child {
  border-bottom: none;
}

.analytics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.insight-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}

.insight-stats.single {
  grid-template-columns: 1fr;
}

.insight-stat {
  background: #fafaf9;
  border: 1px solid #ecece8;
  border-radius: 16px;
  padding: 14px 16px;
}

.insight-stat span {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.insight-stat strong {
  font-size: 24px;
  line-height: 1.1;
}

.subsection-title {
  margin-top: 2px;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #666;
}

.subtext {
  font-size: 11px;
  color: #888;
  margin-top: 3px;
}

.danger-text {
  color: #c73a3a;
}

/* =========================
   REPORTS PAGE
========================= */

.report-filter-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: 16px 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.filter-left {
  min-width: 180px;
}

.filter-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.filter-subtitle {
  margin-top: 4px;
  font-size: 11.5px;
  color: var(--text-muted);
  line-height: 1.35;
  color: #999;
}

.report-filters {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.report-filters input,
.report-filters select {
  height: 35px;
  min-width: 135px;
  padding: 0 11px;
  border-radius: 11px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #222;
  font-size: 12px;
  outline: none;
}

.report-filters input:focus,
.report-filters select:focus {
  border-color: #111;
}

.filter-btn {
  height: 35px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.filter-btn.primary {
  background: #111;
  color: #fff;
  border-color: #111;
}

.filter-btn:hover {
  background: #f8f8f7;
}

.filter-btn.primary:hover {
  background: #000;
}

/* Main report layout */
.report-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}

.report-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.report-side {
  position: sticky;
  top: 24px;
  align-self: start;

  display: flex;
  flex-direction: column;
  gap: 14px;

  padding-left: 18px;
  border-left: 1px solid #e8e8e3;

  padding-bottom: 4px;
}

/* Financial hero */
.financial-card {
  min-height: auto;
}

.financial-chart {
  margin-top: 4px;
  min-height: 260px;
}

.report-kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.report-kpi {
  border: 1px solid #eeeeee;
  background: #fafafa;
  border-radius: 14px;
  padding: 13px 14px;
}

.report-kpi span {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #8a8a8a;
  margin-bottom: 7px;
}

.report-kpi strong {
  font-size: 22px;
  font-weight: 800;
  color: #171717;
  letter-spacing: -0.03em;
}

.danger-text {
  color: #b42318 !important;
}

/* Analytics */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.analytics-card {
  min-height: 280px;
}

.medium-chart {
  min-height: 210px;
}

.apex-chart-wrap {
  width: 100%;
  min-width: 0;
}

.apex-chart-wrap :deep(.apexcharts-tooltip) {
  border-radius: 12px !important;
  box-shadow: 0 16px 45px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid #eeeeee !important;
}

.apex-chart-wrap :deep(.apexcharts-tooltip-title) {
  font-size: 12px !important;
  font-weight: 700 !important;
}

.apex-chart-wrap :deep(text) {
  fill: #777 !important;
}

/* Right side cards */
.collection-card {
  padding-bottom: 16px;
}

.ring-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -14px;
  margin-bottom: -14px;
}

.small-chart {
  min-height: 135px;
}

.summary-stack.compact {
  margin-top: 4px;
}

.summary-stack {
  display: flex;
  flex-direction: column;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 9px 0;
  border-bottom: 1px solid #f1f1ef;
  font-size: 12.5px;
  color: #666;
}

.summary-line:last-child {
  border-bottom: none;
}

.summary-line b {
  color: #222;
  font-weight: 700;
  text-align: right;
}

/* Quick overview */
.mini-stat-list {
  display: flex;
  flex-direction: column;
}

.mini-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f1ef;
  font-size: 12.5px;
  color: #666;
}

.mini-stat-row:last-child {
  border-bottom: none;
}

.mini-stat-row b {
  color: #222;
  font-weight: 700;
  text-align: right;
}

/* Insights */
.insight-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.insight-stat {
  border: 1px solid #eeeeee;
  border-radius: 13px;
  background: #fafafa;
  padding: 12px 13px;
}

.insight-stat span {
  display: block;
  font-size: 11.5px;
  color: #888;
  margin-bottom: 6px;
}

.insight-stat strong {
  font-size: 20px;
  font-weight: 800;
  color: #222;
}

.report-list {
  display: flex;
  flex-direction: column;
}

.report-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f1ef;
}

.report-list-row:last-child {
  border-bottom: none;
}

.subtext {
  margin-top: 3px;
  font-size: 11.5px;
  color: #999;
  line-height: 1.35;
}

.job-price {
  font-size: 13px;
  font-weight: 700;
  color: #222;
  white-space: nowrap;
  text-align: right;
}

.empty-small {
  min-height: 76px;
  display: flex;
  align-items: center;
  color: #999;
  font-size: 12.5px;
  font-style: italic;
}

.empty-state {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
  font-style: italic;
  border: 1px dashed #e3e3df;
  border-radius: 14px;
  background: #fafafa;
}

/* Responsive */
@media (max-width: 1200px) {
  .report-layout {
    grid-template-columns: 1fr;
  }

  .report-side {
    border-left: none;
    padding-left: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .report-filter-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .report-filters {
    width: 100%;
    justify-content: flex-start;
  }

  .report-kpis,
  .analytics-grid,
  .report-side {
    grid-template-columns: 1fr;
  }

  .report-filters input,
  .report-filters select {
    flex: 1;
    min-width: 150px;
  }
}

@media (max-width: 1200px) {
  .report-hero-grid,
  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .hero-top {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .hero-chart-row {
    grid-template-columns: 1fr;
  }

  .hero-chart-values {
    text-align: left;
  }

  .insight-stats {
    grid-template-columns: 1fr;
  }
}
</style>
