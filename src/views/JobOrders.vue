<template>
  <div class="dash">
    <Sidebar :collapsed="collapsed" :menu="menu" @toggle="collapsed = !collapsed" />

    <div class="main">
      <div class="top-bar">
        <div>
          <div class="page-title">Job Orders</div>
          <div class="page-date">Manage currently active workshop jobs</div>
        </div>

        <div class="top-right">
          <input
            class="search"
            v-model="searchQuery"
            placeholder="Search customer / plate / doc no..."
          />
        </div>
      </div>

      <div class="summary-row">
        <div class="summary-card">
          <div class="summary-label">Active Jobs</div>
          <div class="summary-value">{{ jobs.length }}</div>
        </div>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Doc No.</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="job in filteredJobs" :key="job.id">
              <td>{{ job.document_number }}</td>

              <td>
                <div>{{ job.customer?.name || '-' }}</div>
                <small>{{ job.customer?.phone || '-' }}</small>
              </td>

              <td>
                <div>{{ job.vehicle?.license_plate || '-' }}</div>
                <small>
                  {{ job.vehicle?.make || '' }} {{ job.vehicle?.model || '' }}
                </small>
              </td>

              <td>RM {{ formatMoney(job.total_amount) }}</td>
              <td>{{ formatDate(job.created_at) }}</td>

              <td>
                <div class="action-group">
                  <button class="mini-btn" @click="openDetail(job)">View</button>
                  <button class="mini-btn" @click="openWhatsApp(job)">WhatsApp</button>
                  <button class="mini-btn success" @click="markPaid(job.id)">
                    Mark Paid
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredJobs.length === 0">
              <td colspan="6" class="empty-state">No active jobs found.</td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <button @click="prevPage" :disabled="page === 1">←</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="page === totalPages">→</button>
        </div>
      </div>

      <div class="modal" v-if="activeJob" @click.self="activeJob = null">
        <div class="modal-card large">
          <div class="modal-header">
            <span>{{ activeJob.document_number }}</span>
            <button @click="activeJob = null">✕</button>
          </div>

          <div class="modal-body">
            <p><b>Status:</b> {{ activeJob.status }}</p>
            <p><b>Customer:</b> {{ activeJob.customer?.name || '-' }}</p>
            <p><b>Phone:</b> {{ activeJob.customer?.phone || '-' }}</p>
            <p><b>Vehicle:</b> {{ activeJob.vehicle?.license_plate || '-' }}</p>
            <p>
              <b>Car:</b>
              {{ activeJob.vehicle?.make || '-' }}
              {{ activeJob.vehicle?.model || '' }}
              {{ activeJob.vehicle?.year ? `(${activeJob.vehicle.year})` : '' }}
            </p>
            <p><b>Notes:</b> {{ activeJob.notes || '-' }}</p>

            <div class="jobs-section">
              <div class="section-title">Items</div>

              <div
                v-for="item in activeJob.items || []"
                :key="item.id"
                class="job-item"
              >
                <div>
                  <div>
                    {{
                      item.item_type === "service"
                        ? item.service_name
                        : `Part #${item.part_id || "-"}`
                    }}
                  </div>
                  <small>{{ item.note || "-" }}</small>
                </div>

                <div class="job-price">
                  RM {{ formatMoney(item.total_price) }}
                </div>
              </div>
            </div>

            <div class="summary-box">
              <div>Total: RM {{ formatMoney(activeJob.total_amount) }}</div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="openWhatsApp(activeJob)">WhatsApp</button>
            <button class="primary" @click="markPaid(activeJob.id)">
              Mark Paid
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";
import API from "../services/api";

export default {
  components: { Sidebar },

  data() {
    return {
      collapsed: false,

      menu: [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Job Orders", path: "/job-orders", icon: "briefcase" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Report", path: "/report", icon: "chart" },
        { name: "Expense", path: "/expense", icon: "alert" }
      ],

      jobs: [],
      page: 1,
      totalPages: 1,
      searchQuery: "",
      activeJob: null
    };
  },

  mounted() {
    this.fetchJobs();
  },

  computed: {
    filteredJobs() {
      let list = this.jobs || [];

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(job =>
          (job.document_number || "").toLowerCase().includes(q) ||
          (job.customer?.name || "").toLowerCase().includes(q) ||
          (job.vehicle?.license_plate || "").toLowerCase().includes(q)
        );
      }

      return list;
    }
  },

  methods: {
    async fetchJobs(page = 1) {
      try {
        const res = await API.get(`/transactions?status=invoice&page=${page}`);
        this.jobs = res.data.data;
        this.page = res.data.current_page;
        this.totalPages = res.data.last_page;
      } catch (error) {
        console.error("Error fetching job orders:", error);
      }
    },

    async openDetail(job) {
      try {
        const res = await API.get(`/transactions/${job.id}`);
        this.activeJob = res.data;
      } catch (error) {
        console.error("Error loading job detail:", error);
      }
    },

    async markPaid(id) {
      try {
        await API.post(`/transactions/${id}/pay`);
        if (this.activeJob?.id === id) {
          this.activeJob = null;
        }
        this.fetchJobs(this.page);
      } catch (error) {
        console.error("Error marking paid:", error);
      }
    },

    nextPage() {
      if (this.page < this.totalPages) {
        this.fetchJobs(this.page + 1);
      }
    },

    prevPage() {
      if (this.page > 1) {
        this.fetchJobs(this.page - 1);
      }
    },

    openWhatsApp(job) {
      const customerName = job.customer?.name || "Customer";
      const plate = job.vehicle?.license_plate || "-";
      const docNo = job.document_number || "-";
      const amount = this.formatMoney(job.total_amount || 0);

      const msg =
        `Hi ${customerName}, ` +
        `your vehicle ${plate} is currently under service. ` +
        `Document No: ${docNo}. ` +
        `Current invoice amount: RM ${amount}.`;

      const phone = (job.customer?.phone || "").replace(/[^\d]/g, "");
      if (!phone) {
        alert("Customer phone number not available.");
        return;
      }

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`);
    },

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    formatDate(value) {
      if (!value) return "-";
      return new Date(value).toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.dash { display:flex; height:100vh; font-family:Inter; }
.main { flex:1; padding:28px; background:#f9f9f8; }

.summary-row {
  display:flex;
  gap:12px;
  margin-bottom:14px;
}

.summary-card {
  background:#fff;
  border:1px solid #eee;
  border-radius:12px;
  padding:14px 16px;
  min-width:180px;
}

.summary-label {
  font-size:12px;
  color:#999;
  margin-bottom:4px;
}

.summary-value {
  font-size:22px;
  font-weight:600;
}

.card {
  background:#fff;
  border-radius:12px;
  border:1px solid #eee;
}

.mini-btn.success {
  background:#2e7d32;
  color:#fff;
  border-color:#2e7d32;
}

.jobs-section { margin-top:12px; }
.section-title { font-size:12px; color:#999; margin-bottom:6px; }

.job-item {
  display:flex;
  justify-content:space-between;
  font-size:12px;
  padding:8px 0;
  border-bottom:1px solid #f5f5f5;
}

.job-price {
  font-weight:600;
}

.summary-box {
  margin-top:12px;
  padding:12px;
  background:#fafafa;
  border-radius:8px;
  font-weight:600;
}

</style>