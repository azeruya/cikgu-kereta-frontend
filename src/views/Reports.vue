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
        <div class="page-intro">
          <div class="page-title-row">
            <div class="page-title">Laporan</div>
            <span class="page-chip">{{ periodChartRaw.length || 0 }} data periode</span>
          </div>

          <div class="page-date">
            Ringkasan keuangan dan analitik bisnis
          </div>
        </div>

        <div class="top-right">
          <input
            class="search"
            v-model.trim="searchQuery"
            placeholder="Cari pelanggan / plat nomor / merek / model..."
          />
          <button class="pill-btn" type="button" @click="applyFilters">
            Muat Ulang
          </button>
        </div>
      </div>

      <div class="filter-shell">
        <Card>
          <template #header>
            <span class="card-title">Filter</span>
          </template>

          <div class="filters-bar">
            <input type="date" v-model="startDate" />
            <input type="date" v-model="endDate" />

            <select v-model="statusFilter">
              <option value="">Semua Status</option>
              <option value="quotation">Penawaran</option>
              <option value="invoice">Faktur</option>
              <option value="receipt">Struk</option>
            </select>

            <select v-model="paymentStatusFilter">
              <option value="">Semua Pembayaran</option>
              <option value="paid">Lunas</option>
              <option value="unpaid">Belum Lunas</option>
              <option value="partial">Sebagian</option>
            </select>

            <button class="pill-btn" @click="applyFilters">Terapkan</button>
            <button class="pill-btn" @click="clearFilters">Reset</button>
          </div>
        </Card>
      </div>

      <!-- Hero -->
      <div class="report-hero-grid">
        <Card>
          <template #header>
            <span class="card-title hero-title">Ringkasan Keuangan</span>
            <span class="card-link">Periode terpilih</span>
          </template>

          <div class="hero-top">
            <div class="hero-stat">
              <span>Total Pendapatan</span>
              <strong>Rp {{ formatMoney(summary.total_revenue) }}</strong>
            </div>

            <div class="hero-stat">
              <span>Total Pengeluaran</span>
              <strong>Rp {{ formatMoney(summary.total_expenses) }}</strong>
            </div>

            <div class="hero-stat">
              <span>Estimasi Keuntungan</span>
              <strong :class="Number(summary.estimated_profit) < 0 ? 'danger-text' : ''">
                Rp {{ formatMoney(summary.estimated_profit) }}
              </strong>
            </div>
          </div>

          <div v-if="loading" class="empty-state">Memuat laporan...</div>

          <div v-else-if="periodChartRaw.length === 0" class="empty-state">
            Tidak ada data grafik ditemukan.
          </div>

          <div v-else class="hero-chart apex-chart-wrap">
            <apexchart
              type="line"
              height="340"
              :options="financialChartOptions"
              :series="financialChartSeries"
            />
          </div>
        </Card>

        <div class="hero-side">
          <Card>
            <template #header>
              <span class="card-title">Status Pembayaran</span>
            </template>

            <div class="ring-shell apex-chart-wrap small-chart">
              <apexchart
                type="radialBar"
                height="220"
                :options="paidStatusChartOptions"
                :series="paidStatusChartSeries"
              />
            </div>

            <div class="summary-stack">
              <div class="summary-line">
                <span>Lunas</span>
                <b>Rp {{ formatMoney(paidVsUnpaid.paid) }}</b>
              </div>
              <div class="summary-line">
                <span>Belum Lunas</span>
                <b>Rp {{ formatMoney(paidVsUnpaid.unpaid) }}</b>
              </div>
            </div>
          </Card>

          <Card>
            <template #header>
              <span class="card-title">Ringkasan Cepat</span>
            </template>

            <div class="mini-stat-list">
              <div class="mini-stat-row">
                <span>Total Transaksi</span>
                <b>{{ summary.total_transactions }}</b>
              </div>
              <div class="mini-stat-row">
                <span>Total Lunas</span>
                <b>Rp {{ formatMoney(summary.total_paid) }}</b>
              </div>
              <div class="mini-stat-row">
                <span>Total Belum Lunas</span>
                <b>Rp {{ formatMoney(summary.total_unpaid) }}</b>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Analytics -->
      <div class="analytics-grid">
        <Card>
          <template #header>
            <span class="card-title">Pendapatan Berdasarkan Merek</span>
          </template>

          <div v-if="revenueByMake.length === 0" class="empty-small">
            Tidak ada analitik merek ditemukan.
          </div>

          <div v-else class="apex-chart-wrap medium-chart">
            <apexchart
              type="bar"
              height="280"
              :options="makeChartOptions"
              :series="makeChartSeries"
            />
          </div>
        </Card>

        <Card>
          <template #header>
            <span class="card-title">Pendapatan Berdasarkan Model</span>
          </template>

          <div v-if="revenueByModel.length === 0" class="empty-small">
            Tidak ada analitik model ditemukan.
          </div>

          <div v-else class="apex-chart-wrap medium-chart">
            <apexchart
              type="bar"
              height="280"
              :options="modelChartOptions"
              :series="modelChartSeries"
            />
          </div>
        </Card>
      </div>

      <div class="analytics-grid">
        <Card>
          <template #header>
            <span class="card-title">Insight Pelanggan</span>
          </template>

          <div class="insight-stats">
            <div class="insight-stat">
              <span>Pelanggan Unik</span>
              <strong>{{ customerAnalytics.unique_customers || 0 }}</strong>
            </div>
            <div class="insight-stat">
              <span>Pelanggan Tetap</span>
              <strong>{{ customerAnalytics.repeat_customers || 0 }}</strong>
            </div>
          </div>

          <div class="subsection-title">Pelanggan Teratas</div>

          <div
            v-if="!customerAnalytics.top_customers || customerAnalytics.top_customers.length === 0"
            class="empty-small"
          >
            Tidak ada analitik pelanggan ditemukan.
          </div>

          <div v-else class="category-list">
            <div
              v-for="row in customerAnalytics.top_customers"
              :key="row.id"
              class="category-row"
            >
              <div>
                <div class="item-name">{{ row.name }}</div>
                <div class="subtext">{{ row.transactions_count }} transaksi</div>
              </div>
              <div class="job-price">Rp {{ formatMoney(row.revenue) }}</div>
            </div>
          </div>
        </Card>

        <Card>
          <template #header>
            <span class="card-title">Insight Kendaraan</span>
          </template>

          <div class="insight-stats single">
            <div class="insight-stat">
              <span>Kendaraan Unik</span>
              <strong>{{ vehicleAnalytics.unique_vehicles || 0 }}</strong>
            </div>
          </div>

          <div class="subsection-title">Kendaraan Teratas</div>

          <div
            v-if="!vehicleAnalytics.top_vehicles || vehicleAnalytics.top_vehicles.length === 0"
            class="empty-small"
          >
            Tidak ada analitik kendaraan ditemukan.
          </div>

          <div v-else class="category-list">
            <div
              v-for="row in vehicleAnalytics.top_vehicles"
              :key="row.id"
              class="category-row"
            >
              <div>
                <div class="item-name">
                  {{ row.license_plate }} - {{ row.make }} {{ row.model }}
                </div>
                <div class="subtext">
                  {{ row.year || "-" }} • {{ row.transactions_count }} transaksi
                </div>
              </div>
              <div class="job-price">Rp {{ formatMoney(row.revenue) }}</div>
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
      collapsed: false,
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
    { name: "Beranda", path: "/dashboard", icon: "grid" },
    { name: "Transaksi", path: "/transactions", icon: "list" },
    { name: "Pelanggan", path: "/customers", icon: "user" },
    { name: "Inventaris", path: "/inventory", icon: "box" },
    { name: "Pengeluaran", path: "/expenses", icon: "alert" },
  ];

  if (this.currentUser?.role === "admin") {
    baseMenu.push(
      { name: "Laporan", path: "/reports", icon: "chart" },
      { name: "Pengguna", path: "/users", icon: "user" }
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
      name: "Pendapatan",
      type: "column",
      data: this.periodChartRaw.map((row) => Number(row.revenue || 0)),
    },
    {
      name: "Pengeluaran",
      type: "column",
      data: this.periodChartRaw.map((row) => Number(row.expense || 0)),
    },
    {
      name: "Keuntungan",
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
          formatter: (value) => `Rp ${this.shortMoney(value)}`,
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
          formatter: (value) => `Rp ${this.formatMoney(value)}`,
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
      labels: ["Lunas"],
      colors: ["#111111"],
    };
  },

  makeChartSeries() {
    return [
      {
        name: "Pendapatan",
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
          formatter: (value) => `Rp ${this.shortMoney(value)}`,
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
          formatter: (value) => `Rp ${this.formatMoney(value)}`,
        },
      },
      colors: ["#111111"],
    };
  },

  modelChartSeries() {
    return [
      {
        name: "Pendapatan",
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
          formatter: (value) => `Rp ${this.shortMoney(value)}`,
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
          formatter: (value) => `Rp ${this.formatMoney(value)}`,
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
  const amount = Number(value || 0) * 1000;

  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
},

shortMoney(value) {
  const num = Number(value || 0) * 1000;

  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)} M`;
  }

  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} jt`;
  }

  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(0)} rb`;
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(num);
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
  min-height: 220px;
}

.medium-chart {
  min-height: 280px;
}

.filter-shell {
  margin-bottom: 16px;
}

.report-hero-grid {
  display: grid;
  grid-template-columns: 1.55fr 0.75fr;
  gap: 16px;
  margin-bottom: 16px;
}

.report-hero-grid > :first-child {
  padding: 22px;
  border-radius: 20px;
}

.hero-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero-side .card {
  padding: 16px;
}

.hero-title {
  font-size: 18px;
}

.hero-top {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.hero-stat {
  background: transparent;
  border: none;
  padding: 0;
}

.hero-stat span {
  display: block;
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.hero-stat strong {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.hero-chart {
  margin-top: 10px;
  padding-top: 6px;
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

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid #f2f2f0;
}

.category-row:last-child {
  border-bottom: none;
}

.subtext {
  font-size: 11px;
  color: #888;
  margin-top: 3px;
}

.danger-text {
  color: #c73a3a;
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