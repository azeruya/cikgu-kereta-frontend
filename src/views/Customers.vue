<template>
  <div class="dash">

    <Sidebar :collapsed="collapsed" :menu="menu" @toggle="collapsed = !collapsed" />

    <div class="main">

      <!-- HEADER -->
      <div class="top-bar">
        <div>
          <div class="page-title">Customers</div>
          <div class="page-date">Manage your workshop customers</div>
        </div>

        <div class="top-right">
          <input class="search" v-model="searchQuery" placeholder="Search customer..." />
          <button class="pill-btn">Export</button>
          <button class="pill-btn primary">+ Add Customer</button>
        </div>
      </div>

      <!-- FILTER -->
      <div class="tabs">
        <button 
          v-for="tab in tabs"
          :key="tab"
          :class="['tab', { active: activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <!-- TABLE CARD -->
      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Visits</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="cust in paginatedCustomers" :key="cust.id" @click="openDetail(cust)">
              <td class="cust-cell">
                <div class="avatar">{{ cust.name[0] }}</div>
                <div>
                  <div class="cust-name">{{ cust.name }}</div>
                </div>
              </td>
              <td>{{ cust.phone }}</td>
              <td>{{ cust.vehicle }}</td>
              <td>{{ cust.visits }}</td>
              <td>RM {{ cust.total }}</td>
              <td>
                <span :class="['status', cust.status.toLowerCase()]">
                  {{ cust.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- PAGINATION -->
        <div class="pagination">
          <button @click="prevPage" :disabled="page === 1">←</button>
          <span>{{ page }} / {{ totalPages }}</span>
          <button @click="nextPage" :disabled="page === totalPages">→</button>
        </div>
      </div>

      <!-- MODAL -->
      <div class="modal" v-if="activeCustomer" @click.self="activeCustomer=null">
        <div class="modal-card">

          <div class="modal-header">
            <span>{{ activeCustomer.name }}</span>
            <button @click="activeCustomer=null">✕</button>
          </div>

          <div class="modal-body">
            <p><b>Phone:</b> {{ activeCustomer.phone }}</p>
            <p><b>Vehicle:</b> {{ activeCustomer.vehicle }}</p>
            <p><b>Total Visits:</b> {{ activeCustomer.visits }}</p>
            <p><b>Total Spent:</b> RM {{ activeCustomer.total }}</p>

            <div class="jobs-section">
              <div class="section-title">Recent Jobs</div>

              <div v-for="job in activeCustomer.jobs" :key="job.id" class="job-item">
                <div>{{ job.service }}</div>
                <div class="job-price">RM {{ job.price }}</div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="openWhatsApp(activeCustomer)">WhatsApp</button>
            <button>Edit</button>
            <button class="primary">View Jobs</button>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";

export default {
  components: { Sidebar },

  data() {
    return {
      collapsed: false,

      menu: [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Report", path: "/report", icon: "chart" },
        { name: "Expense", path: "/expense", icon: "alert" }
      ],

      customers: [
        {
          id: 1,
          name: "Hafiz Rahman",
          phone: "60123456789",
          vehicle: "WPL1234",
          visits: 5,
          total: 1200,
          status: "Active",
          jobs: [
            { id: 1, service: "Engine service", price: 320 },
            { id: 2, service: "Oil change", price: 120 }
          ]
        }
      ],

      searchQuery: "",
      tabs: ["All", "Active", "Inactive"],
      activeTab: "All",

      page: 1,
      perPage: 5,

      activeCustomer: null
    };
  },

  computed: {
    filteredCustomers() {
      let list = this.customers;

      if (this.activeTab !== "All") {
        list = list.filter(c => c.status === this.activeTab);
      }

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter(c =>
          c.name.toLowerCase().includes(q)
        );
      }

      return list;
    },

    totalPages() {
      return Math.ceil(this.filteredCustomers.length / this.perPage);
    },

    paginatedCustomers() {
      const start = (this.page - 1) * this.perPage;
      return this.filteredCustomers.slice(start, start + this.perPage);
    }
  },

  methods: {
    openDetail(c) {
      this.activeCustomer = c;
    },

    nextPage() {
      if (this.page < this.totalPages) this.page++;
    },

    prevPage() {
      if (this.page > 1) this.page--;
    },

    openWhatsApp(c) {
      const msg = `Hi ${c.name}, your vehicle (${c.vehicle}) is ready.`;
      window.open(`https://wa.me/${c.phone}?text=${encodeURIComponent(msg)}`);
    }
  }
};
</script>

<style>
.dash { display:flex; height:100vh; font-family:Inter; }
.main { flex:1; padding:28px; background:#f9f9f8; }

/* HEADER */
.top-bar { display:flex; justify-content:space-between; margin-bottom:16px; }
.page-title { font-size:20px; font-weight:600; }
.page-date { font-size:12px; color:#999; }

.top-right { display:flex; gap:10px; }

.search {
  padding:8px 12px;
  border:1px solid #ddd;
  border-radius:8px;
}

.pill-btn {
  border:1px solid #ddd;
  padding:8px 12px;
  border-radius:8px;
  background:#fff;
}

.pill-btn.primary {
  background:#111;
  color:#fff;
}

/* TABS */
.tabs { display:flex; gap:6px; margin-bottom:12px; }
.tab { padding:6px 12px; border-radius:8px; border:1px solid #ddd; }
.tab.active { background:#111; color:#fff; }

/* CARD */
.card {
  background:#fff;
  border-radius:12px;
  border:1px solid #eee;
}

/* TABLE */
.table { width:100%; border-collapse:collapse; }
.table th { text-align:left; padding:12px; font-size:12px; color:#999; }
.table td { padding:12px; border-top:1px solid #f0f0f0; }
.table tr:hover { background:#fafafa; }

.cust-cell { display:flex; gap:10px; align-items:center; }
.avatar {
  width:32px; height:32px;
  border-radius:50%;
  background:#111; color:#fff;
  display:flex; align-items:center; justify-content:center;
}

.status.active { color:#2e7d32; }
.status.inactive { color:#999; }

/* PAGINATION */
.pagination {
  display:flex;
  justify-content:center;
  gap:10px;
  padding:12px;
}

/* MODAL */
.modal {
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.2);
  display:flex;
  align-items:center;
  justify-content:center;
}

.modal-card {
  width:320px;
  background:#fff;
  border-radius:12px;
  padding:16px;
}

.modal-header {
  display:flex;
  justify-content:space-between;
  margin-bottom:10px;
  font-weight:600;
}

.jobs-section { margin-top:12px; }
.section-title { font-size:12px; color:#999; margin-bottom:6px; }

.job-item {
  display:flex;
  justify-content:space-between;
  font-size:12px;
  padding:6px 0;
}

.modal-actions {
  display:flex;
  gap:6px;
  margin-top:12px;
}

.modal-actions button {
  flex:1;
  padding:8px;
  border-radius:8px;
  border:1px solid #ddd;
}

.modal-actions .primary {
  background:#111;
  color:#fff;
}
</style>