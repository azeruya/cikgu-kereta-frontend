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

          <router-link to="/transactions/new" class="btn btn-primary btn-pill link-btn">
            + New transaction
          </router-link>
        </div>
      </div>

      <div v-if="error" class="page-error">
        {{ error }}
      </div>

      <!-- KPI STRIP -->
      <section class="metric-strip" :class="{ 'staff-metrics': !isAdmin }">
        <div
          v-for="metric in metrics"
          :key="metric.label"
          class="metric-cell"
        >
          <div class="metric-top">
            <span>{{ metric.label }}</span>

            <div class="metric-icon" :class="metric.iconClass">
              {{ metric.icon }}
            </div>
          </div>

          <strong>{{ metric.value }}</strong>
          <p v-html="metric.sub"></p>
        </div>
      </section>

      <!-- MAIN GRID -->
      <section class="dashboard-grid-clean">
        <!-- TODAY TRANSACTIONS -->
        <Card class="dashboard-panel today-panel">
          <template #header>
            <div class="panel-head">
              <div>
                <h3>Today's transactions</h3>
                <p>Jobs created or updated today.</p>
              </div>

              <router-link to="/transactions" class="panel-link">
                View all
              </router-link>
            </div>
          </template>

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
                  @click="goToTransaction(trx.id)"
                >
                  <td>
                    <strong>{{ trx.customer }}</strong>
                    <span>{{ trx.plate }}</span>
                  </td>

                  <td>
                    <strong>{{ trx.work }}</strong>
                  </td>

                  <td>
                    <span class="badge" :class="trx.badgeClass">
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
          <template #header>
            <div class="panel-head">
              <div>
                <h3>Needs attention</h3>
                <p>Stock and online requests to review.</p>
              </div>
            </div>
          </template>

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

            <div v-if="importMessage" class="import-message compact">
              {{ importMessage }}
            </div>

            <div v-if="onlineRequests.length > 0" class="request-list-clean">
              <div
                v-for="request in onlineRequests.slice(0, 3)"
                :key="request.id"
                class="request-item-clean"
              >
                <div class="request-copy">
                  <strong>{{ requestCustomerName(request) }}</strong>

                  <p>
                    {{ requestVehiclePlate(request) }}

                    <span v-if="requestVehicleText(request)">
                      · {{ requestVehicleText(request) }}
                    </span>
                  </p>
                </div>

                <div class="request-actions">
                  <span class="small-pill">
                    {{ request.status || "Pending" }}
                  </span>

                  <button
                    v-if="request.status !== 'converted'"
                    type="button"
                    class="convert-btn"
                    @click="convertOnlineRequest(request)"
                  >
                    Convert
                  </button>
                </div>
              </div>
            </div>

            <div v-else class="attention-empty">
              No online requests waiting.
            </div>
          </div>
        </Card>

        <!-- RECENT ACTIVITY -->
        <Card class="dashboard-panel activity-panel">
          <template #header>
            <div class="panel-head">
              <div>
                <h3>Recent activity</h3>
                <p>Latest workshop updates.</p>
              </div>
            </div>
          </template>

          <div v-if="activityItems.length > 0" class="activity-list-clean">
            <div
              v-for="(activity, index) in activityItems.slice(0, 6)"
              :key="index"
              class="activity-row-clean"
            >
              <span
                class="activity-dot"
                :class="activity.type"
              ></span>

              <div>
                <p v-html="activity.message"></p>
                <small>{{ activity.time }}</small>
              </div>
            </div>
          </div>

          <div v-else class="attention-empty">
            No recent activity yet.
          </div>
        </Card>

        <!-- QUICK ACTIONS -->
        <Card class="dashboard-panel quick-panel">
          <template #header>
            <div class="panel-head">
              <div>
                <h3>Quick actions</h3>
                <p>Common workshop shortcuts.</p>
              </div>
            </div>
          </template>

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
                <p>{{ importingRequests ? "Importing..." : "From online form" }}</p>
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

            <router-link
              v-else
              to="/customers"
              class="quick-action-clean"
            >
              <span>☻</span>
              <div>
                <strong>Customers</strong>
                <p>View customer list</p>
              </div>
            </router-link>
          </div>
        </Card>
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
      } catch (error) {
        return null;
      }
    },

    isAdmin() {
      return this.currentUser && this.currentUser.role === "admin";
    },

    menu() {
      const baseMenu = [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Expenses", path: "/expenses", icon: "alert" },
      ];

      if (this.currentUser && this.currentUser.role === "admin") {
        baseMenu.push(
          { name: "Reports", path: "/reports", icon: "chart" },
          { name: "Users", path: "/users", icon: "user" }
        );
      }

      return baseMenu;
    },

    firstName() {
      const fullName =
        this.currentUser && this.currentUser.name
          ? this.currentUser.name
          : "there";

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
          value: "RM " + this.formatMoney(this.summary.today_revenue),
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
            ? "RM " + this.formatMoney(this.summary.pending_receipts_amount)
            : this.summary.pending_receipts_count,
          sub: this.isAdmin
            ? "From " + this.summary.pending_receipts_count + " transaction(s)"
            : "Transaction(s) awaiting receipt",
          iconClass: "mi-soft",
          icon: "◔",
        },
        {
          label: "LOW STOCK ALERTS",
          value: this.summary.low_stock_count,
          sub:
            '<span class="metric-down">' +
            this.summary.critical_stock_count +
            " critical</span>",
          iconClass: "mi-soft",
          icon: "!",
        }
      );

      return baseMetrics;
    },

    todayTransactions() {
      return this.todayTransactionsRaw.map((trx) => {
        const items = Array.isArray(trx.items) ? trx.items : [];
        const firstItem = items.length > 0 ? items[0] : null;

        const work =
          (firstItem && firstItem.service_name) ||
          (firstItem && firstItem.part && firstItem.part.name) ||
          (firstItem && firstItem.note) ||
          "Workshop service";

        return {
          id: trx.id,
          customer: trx.customer && trx.customer.name ? trx.customer.name : "-",
          plate:
            trx.vehicle && trx.vehicle.license_plate
              ? trx.vehicle.license_plate
              : "-",
          work,
          status: this.capitalize(trx.status),
          badgeClass: this.statusClass(trx.status),
          total: "RM " + this.formatMoney(trx.total_amount),
        };
      });
    },

    lowStockItems() {
      return this.lowStockItemsRaw.map((item) => {
        const threshold = Number(item.min_stock_threshold || 0);
        const stock = Number(item.stock || 0);

        return {
          id: item.id,
          name: item.variant ? item.name + " — " + item.variant : item.name,
          min: threshold,
          left: stock,
          level: stock <= threshold ? "critical" : "low",
        };
      });
    },

    activityItems() {
      return this.recentActivity.map((activity) => {
        return {
          message: activity.message || activity.text || "-",
          time: activity.time || activity.created_at || "-",
          type: activity.type || activity.dotClass || "default",
        };
      });
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
        try {
          this.applyDashboardData(JSON.parse(cached));
        } catch (error) {
          sessionStorage.removeItem("dashboard");
        }
      } else {
        this.loading = true;
      }

      try {
        const res = await api.get("/dashboard");

        this.applyDashboardData(res.data);
        sessionStorage.setItem("dashboard", JSON.stringify(res.data));
      } catch (error) {
        console.error("Error loading dashboard:", error);
        this.error =
          error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : "Failed to load dashboard.";
      } finally {
        this.loading = false;
      }
    },

    applyDashboardData(data) {
      data = data || {};

      this.summary = data.summary || this.summary;
      this.todayTransactionsRaw = Array.isArray(data.today_transactions)
        ? data.today_transactions
        : [];
      this.weeklyRevenueRaw = Array.isArray(data.weekly_revenue)
        ? data.weekly_revenue
        : [];
      this.lowStockItemsRaw = Array.isArray(data.low_stock_items)
        ? data.low_stock_items
        : [];
      this.recentActivity = Array.isArray(data.recent_activity)
        ? data.recent_activity
        : [];
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

        if (Array.isArray(res.data)) {
          this.onlineRequests = res.data;
        } else if (res.data && Array.isArray(res.data.data)) {
          this.onlineRequests = res.data.data;
        } else {
          this.onlineRequests = [];
        }
      } catch (error) {
        console.error("Error loading online requests:", error);
        this.onlineRequests = [];
      }
    },

    async importOnlineRequests() {
      this.importingRequests = true;
      this.importMessage = "";
      this.error = "";

      try {
        const res = await api.post("/online-requests/import");

        this.importMessage =
          res.data && res.data.message ? res.data.message : "Import completed.";

        sessionStorage.removeItem("dashboard");

        await this.fetchOnlineRequests();
        await this.fetchDashboard();
      } catch (error) {
        console.error("Error importing online requests:", error);
        this.error =
          error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : "Failed to import online requests.";
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

    goToTransaction(id) {
      this.$router.push("/transactions/" + id);
    },

    requestCustomerName(request) {
      if (request.customer && request.customer.name) {
        return request.customer.name;
      }

      return request.customer_name || request.name || "-";
    },

    requestVehiclePlate(request) {
      if (request.vehicle && request.vehicle.license_plate) {
        return request.vehicle.license_plate;
      }

      return request.license_plate || request.plate_number || "-";
    },

    requestVehicleText(request) {
      const make =
        request.vehicle && request.vehicle.make
          ? request.vehicle.make
          : request.vehicle_make || "";

      const model =
        request.vehicle && request.vehicle.model
          ? request.vehicle.model
          : request.vehicle_model || request.car_model || "";

      return (make + " " + model).trim();
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
      return "badge-muted";
    },
  },
};
</script>

<style scoped>
.main {
  min-height: 100vh;
  padding: 30px 38px 42px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.92), transparent 34%),
    var(--bg);
}

/* HEADER */
.dashboard-header {
  max-width: 1380px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 18px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 27px;
  font-weight: 900;
  letter-spacing: -0.045em;
  color: #0f172a;
}

.dashboard-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 10.5px;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #748195;
}

.dashboard-meta span:nth-child(2) {
  color: #c3cad5;
}

.dashboard-header p {
  margin: 7px 0 0;
  font-size: 13px;
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
  max-width: 1380px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
  border: 1px solid #dfe5ee;
  border-radius: 17px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
}

.metric-strip.staff-metrics {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-cell {
  min-height: 92px;
  padding: 15px 17px;
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
  font-size: 10px;
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
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: #0f172a;
  line-height: 1.05;
}

.metric-cell p {
  margin: 7px 0 0;
  font-size: 12px;
  color: #8a96a8;
  line-height: 1.25;
}

.metric-down {
  color: #dc2626;
  font-weight: 750;
}

.mi-soft {
  background: #f4f6f8;
  color: #475569;
}

/* MAIN DASHBOARD GRID */
.dashboard-grid-clean {
  max-width: 1380px;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
  gap: 14px;
  align-items: start;
}

.dashboard-panel {
  min-width: 0;
  overflow: hidden;
}

.dashboard-panel :deep(.card-header),
.dashboard-panel :deep(.card-head) {
  align-items: flex-start;
  margin-bottom: 10px;
}

.dashboard-panel :deep(.card-body),
.dashboard-panel :deep(.card-content) {
  padding-top: 0;
}

.panel-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.panel-head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
}

.panel-head p {
  margin: 5px 0 0;
  font-size: 12px;
  color: #8a96a8;
  line-height: 1.35;
}

.panel-link,
.button-link {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 12px;
  font-weight: 800;
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
  font-size: 10px;
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

/* EMPTY */
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

/* REQUESTS */
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
}

.request-copy {
  min-width: 0;
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

.request-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
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

.convert-btn {
  height: 25px;
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

/* ACTIVITY */
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
.activity-dot.success,
.activity-dot.dot-green {
  background: #16a34a;
}

.activity-dot.quotation,
.activity-dot.dot-amber {
  background: #f59e0b;
}

.activity-dot.dot-purple {
  background: #7c3aed;
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
  .main {
    padding: 30px 32px 40px;
  }

  .dashboard-grid-clean {
    grid-template-columns: 1fr;
  }

  .attention-panel {
    grid-row: auto;
  }
}

@media (max-width: 900px) {
  .metric-strip,
  .metric-strip.staff-metrics {
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

  .dashboard-header-actions .btn,
  .dashboard-header-actions .link-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .main {
    padding: 24px 16px;
  }

  .metric-strip,
  .metric-strip.staff-metrics,
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