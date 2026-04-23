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
            <div class="page-title">Customers</div>
            <span class="page-chip">
            {{
                activeTab === "all"
                ? `${filteredCustomers.length} customer${filteredCustomers.length === 1 ? "" : "s"}`
                : `${filteredCustomers.length} ${activeTab}`
            }}
            </span>
        </div>

        <div class="page-date">
            View customer records, vehicles, and recent workshop activity
        </div>
        </div>

        <div class="top-right">
        <input
            class="search"
            v-model.trim="searchQuery"
            placeholder="Search customer..."
        />
        <button class="pill-btn" type="button">Export</button>
        <button class="pill-btn primary" type="button" @click="openFormModal()">
            + Add Customer
        </button>
        </div>
    </div>

    <div class="tabs">
        <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="['tab', { active: activeTab === tab.value }]"
        @click="changeTab(tab.value)"
        >
        {{ tab.label }}
        </button>
    </div>

      <div class="card">
        <div v-if="loading" class="empty-state">Loading customers...</div>

        <template v-else>
          <table class="table" v-if="filteredCustomers.length > 0">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Vehicles</th>
                <th>Latest Activity</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="cust in filteredCustomers"
                :key="cust.id"
                class="clickable-row"
                @click="openDetail(cust)"
              >
                <td class="cust-cell">
                  <div class="circle-avatar">
                    {{ customerInitials(cust.name) }}
                  </div>

                    <div class="cust-text">
                    <div class="cust-name">{{ cust.name }}</div>
                    <div class="cust-meta">{{ customerStatusLabel(cust) }}</div>
                    </div>
                </td>

                <td>{{ cust.phone || "-" }}</td>
                <td>{{ cust.email || "-" }}</td>
                <td>
                  {{ cust.vehicles?.length || 0 }}
                  <span v-if="cust.vehicles?.[0]">
                    · {{ cust.vehicles[0].license_plate }}
                  </span>
                </td>
                <td>
                  <span :class="['status-pill', customerStatusClass(cust)]">
                    {{ customerStatusLabel(cust) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-else class="empty-state">
            No customers found.
          </div>

          <div class="pagination" v-if="totalPages > 1">
            <button @click="prevPage" :disabled="page === 1">←</button>
            <span>{{ page }} / {{ totalPages }}</span>
            <button @click="nextPage" :disabled="page === totalPages">→</button>
          </div>
        </template>
      </div>

      <Teleport to="body">
      <div class="modal" v-if="activeCustomer" @click.self="closeDetail">
        <div v-if="detailLoading" class="modal-card">
          <div class="empty-state">Loading customer details...</div>
        </div>

        <div v-else class="modal-card large">
          <div class="modal-header">
            <span>{{ activeCustomer.name }}</span>
            <button class="mini-btn" @click="closeDetail">✕</button>
          </div>

          <div class="modal-body">
            <div class="customer-detail-grid">
              <div><b>Phone:</b> {{ activeCustomer.phone || "-" }}</div>
              <div><b>Email:</b> {{ activeCustomer.email || "-" }}</div>
              <div><b>Address:</b> {{ activeCustomer.address || "-" }}</div>
              <div><b>Total Visits:</b> {{ activeCustomer.transactions_count || 0 }}</div>
              <div>
                <b>Total Spent:</b>
                RM {{ formatMoney(activeCustomer.transactions_sum_total_amount) }}
              </div>
            </div>

            <div class="jobs-section">
              <div class="section-title">Vehicles</div>

              <div
                v-for="vehicle in activeCustomer.vehicles || []"
                :key="vehicle.id"
                class="job-item"
              >
                <div>
                  <div class="item-name">{{ vehicle.license_plate }}</div>
                  <small>
                    {{ vehicle.make || "-" }} {{ vehicle.model || "" }}
                    <span v-if="vehicle.year"> · {{ vehicle.year }}</span>
                  </small>
                </div>
              </div>

              <div
                v-if="!activeCustomer.vehicles || activeCustomer.vehicles.length === 0"
                class="empty-small"
              >
                No vehicles found
              </div>
            </div>

            <div class="jobs-section">
              <div class="section-title">Recent Transactions</div>

              <div
                v-for="trx in activeCustomer.transactions || []"
                :key="trx.id"
                class="job-item"
              >
                <div>
                  <div class="item-name">{{ trx.document_number || "-" }}</div>
                  <small>
                    {{ trx.vehicle?.license_plate || "-" }} · {{ trx.status || "-" }}
                  </small>
                </div>
                <div class="job-price">
                  RM {{ formatMoney(trx.total_amount) }}
                </div>
              </div>

              <div
                v-if="!activeCustomer.transactions || activeCustomer.transactions.length === 0"
                class="empty-small"
              >
                No recent transactions
              </div>
            </div>
          </div>

            <div class="modal-actions">
            <button type="button" class="mini-btn" @click="closeDetail">✕</button>
            <button @click="openWhatsApp(activeCustomer)">WhatsApp</button>
            <button @click="openFormModal(activeCustomer)">Edit</button>
            <button @click="deleteCustomer(activeCustomer)">Delete</button>
            <button class="primary" @click="viewCustomerTransactions(activeCustomer)">
                View Transactions
            </button>
            </div>
        </div>
      </div>
        </Teleport>

      <div v-if="error" class="page-error">
        {{ error }}
      </div>
    </div>
  </div>

<Teleport to="body">
  <div v-if="showFormModal" class="modal" @click.self="closeFormModal">
    <div class="modal-card large">
      <div class="modal-header">
        <span>{{ editingCustomerId ? "Edit Customer" : "Add Customer" }}</span>
        <button type="button" class="mini-btn" @click="closeFormModal">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-grid">
          <div class="field">
            <label>Name</label>
            <input v-model="form.name" type="text" placeholder="Customer name" />
          </div>

          <div class="field">
            <label>Phone</label>
            <input v-model="form.phone" type="text" placeholder="Phone number" />
          </div>

          <div class="field">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="Email address" />
          </div>

          <div class="field full">
            <label>Address</label>
            <textarea
              v-model="form.address"
              rows="3"
              placeholder="Customer address"
            ></textarea>
          </div>
        </div>

        <div v-if="!editingCustomerId" class="vehicle-form-box">
          <div class="section-title">Vehicle Information</div>

          <label class="checkbox-row">
            <input v-model="form.add_vehicle" type="checkbox" />
            <span>Add vehicle now</span>
          </label>

          <div v-if="form.add_vehicle" class="form-grid" style="margin-top:12px;">
            <div class="field">
              <label>License Plate</label>
              <input
                v-model="form.vehicle_license_plate"
                type="text"
                placeholder="e.g. ABC1234"
              />
            </div>

            <div class="field">
              <label>Make</label>
              <input
                v-model="form.vehicle_make"
                type="text"
                placeholder="e.g. Toyota"
              />
            </div>

            <div class="field">
              <label>Model</label>
              <input
                v-model="form.vehicle_model"
                type="text"
                placeholder="e.g. Vios"
              />
            </div>

            <div class="field">
              <label>Year</label>
              <input
                v-model="form.vehicle_year"
                type="number"
                min="1950"
                max="2100"
                placeholder="e.g. 2020"
              />
            </div>
          </div>
        </div>

        <div v-if="formError" class="page-error" style="margin-top:12px;">
          {{ formError }}
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" @click="closeFormModal">Cancel</button>
        <button
          type="button"
          class="primary"
          :disabled="savingForm"
          @click="submitCustomer"
        >
          {{ savingForm ? "Saving..." : (editingCustomerId ? "Update" : "Create") }}
        </button>
      </div>
    </div>
  </div>
</Teleport>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";
import api from "../services/api";

export default {
  components: { Sidebar },

  data() {
    return {
      collapsed: false,
      loading: false,
      detailLoading: false,
      error: "",

      menu: [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Expenses", path: "/expenses", icon: "alert" },
        { name: "Reports", path: "/reports", icon: "chart" }
      ],

      tabs: [
        { label: "All", value: "all" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" }
      ],

      activeTab: "all",
      customers: [],
      page: 1,
      totalPages: 1,
      activeCustomer: null,
      searchQuery: "",
      showFormModal: false,
      editingCustomerId: null,
      savingForm: false,
      formError: "",
      form: {
        name: "",
        phone: "",
        email: "",
        address: "",
        add_vehicle: true,
        vehicle_license_plate: "",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_year: ""
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

    filteredCustomers() {
      let list = this.customers || [];

      if (this.activeTab === "active") {
        list = list.filter((c) => c.latest_transaction?.status === "invoice");
      } else if (this.activeTab === "inactive") {
        list = list.filter((c) => c.latest_transaction?.status !== "invoice");
      }

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter((c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.phone || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q)
        );
      }

      return list;
    }
  },

  mounted() {
    this.fetchCustomers();
  },

  methods: {
    getCacheKey(page = 1) {
      return `customers-${this.activeTab}-page-${page}`;
    },

    async fetchCustomers(page = 1) {
      const cacheKey = this.getCacheKey(page);
      const cached = sessionStorage.getItem(cacheKey);

      this.error = "";

      if (cached) {
        const parsed = JSON.parse(cached);
        this.customers = parsed.data || [];
        this.page = parsed.current_page || 1;
        this.totalPages = parsed.last_page || 1;
      } else {
        this.loading = true;
      }

      try {
        const res = await api.get(`/customers?page=${page}`);

        this.customers = res.data.data || [];
        this.page = res.data.current_page || 1;
        this.totalPages = res.data.last_page || 1;

        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
      } catch (error) {
        console.error("Error fetching customers:", error);
        this.error =
          error.response?.data?.message || "Failed to load customers.";
      } finally {
        this.loading = false;
      }
    },

    changeTab(tab) {
      this.activeTab = tab;
      this.page = 1;
      this.fetchCustomers(1);
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

    async openDetail(customer) {
    this.activeCustomer = {
        id: customer.id,
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        vehicles: customer.vehicles || []
    };

    this.detailLoading = true;
    this.error = "";

    try {
        const res = await api.get(`/customers/${customer.id}`);
        this.activeCustomer = res.data;
    } catch (error) {
        console.error("Error loading customer detail:", error);
        this.error =
        error.response?.data?.message || "Failed to load customer detail.";
    } finally {
        this.detailLoading = false;
    }
    },

    closeDetail() {
      this.activeCustomer = null;
      this.detailLoading = false;
    },

    nextPage() {
      if (this.page < this.totalPages) {
        this.fetchCustomers(this.page + 1);
      }
    },

    prevPage() {
      if (this.page > 1) {
        this.fetchCustomers(this.page - 1);
      }
    },

    openWhatsApp(customer) {
      const plate = customer.vehicles?.[0]?.license_plate || "-";
      const msg = `Hi ${customer.name}, regarding your vehicle (${plate}), feel free to contact us for updates.`;

      const phone = (customer.phone || "").replace(/[^\d]/g, "");
      if (!phone) {
        alert("Customer phone number not available.");
        return;
      }

      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    },

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    customerInitials(name) {
      return (name || "C")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    },

    customerStatusLabel(customer) {
      const status = customer.latest_transaction?.status;

      if (status === "invoice") return "Active Job";
      if (status === "quotation") return "Pending Quote";
      if (status === "receipt") return "Completed";
      return "No Recent Job";
    },

    customerStatusClass(customer) {
      const status = customer.latest_transaction?.status;

      if (status === "invoice") return "sp-green";
      if (status === "quotation") return "sp-amber";
      if (status === "receipt") return "sp-blue";
      return "sp-gray";
    },

    openFormModal(customer = null) {
    this.formError = "";

    if (customer) {
        this.editingCustomerId = customer.id;
        this.form = {
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        add_vehicle: false,
        vehicle_license_plate: "",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_year: ""
        };
    } else {
        this.editingCustomerId = null;
        this.form = {
        name: "",
        phone: "",
        email: "",
        address: "",
        add_vehicle: true,
        vehicle_license_plate: "",
        vehicle_make: "",
        vehicle_model: "",
        vehicle_year: ""
        };
    }

    this.showFormModal = true;
    },

    closeFormModal() {
    this.showFormModal = false;
    this.editingCustomerId = null;
    this.formError = "";
    },

    async submitCustomer() {
    this.savingForm = true;
    this.formError = "";

    try {
        const customerPayload = {
        name: this.form.name,
        phone: this.form.phone || null,
        email: this.form.email || null,
        address: this.form.address || null
        };

        let customerId = this.editingCustomerId;

        if (this.editingCustomerId) {
        await api.put(`/customers/${this.editingCustomerId}`, customerPayload);
        } else {
        const customerRes = await api.post("/customers", customerPayload);
        customerId = customerRes.data.id;

        if (this.form.add_vehicle) {
            if (
            !this.form.vehicle_license_plate ||
            !this.form.vehicle_make ||
            !this.form.vehicle_model ||
            !this.form.vehicle_year
            ) {
            throw new Error("Please complete all vehicle fields or untick Add vehicle now.");
            }

            await api.post("/vehicles", {
            customer_id: customerId,
            license_plate: this.form.vehicle_license_plate,
            make: this.form.vehicle_make,
            model: this.form.vehicle_model,
            year: Number(this.form.vehicle_year)
            });
        }
        }

        this.closeFormModal();

        await this.fetchCustomers(this.page);

        if (customerId) {
        await this.openDetail({ id: customerId });
        }
    } catch (error) {
        console.error("Error saving customer:", error);

        if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        this.formError = Array.isArray(firstError)
            ? firstError[0]
            : "Validation failed.";
        } else {
        this.formError =
            error.message ||
            error.response?.data?.message ||
            "Failed to save customer.";
        }
    } finally {
        this.savingForm = false;
    }
    },

    async deleteCustomer(customer) {
    const ok = confirm(`Delete customer "${customer.name}"?`);
    if (!ok) return;

    try {
        await api.delete(`/customers/${customer.id}`);

        if (this.activeCustomer?.id === customer.id) {
        this.closeDetail();
        }

        await this.fetchCustomers(this.page);
    } catch (error) {
        console.error("Error deleting customer:", error);
        this.error = error.response?.data?.message || "Failed to delete customer.";
    }
    },

    viewCustomerTransactions(customer) {
    this.closeDetail();
    this.$router.push(`/transactions?customer_id=${customer.id}`);
    },
  }
};
</script>

<style scoped>
.cust-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cust-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cust-name {
  font-size: 13px;
  font-weight: 600;
  color: #171717;
  line-height: 1.2;
}

.cust-meta {
  font-size: 11px;
  color: #9a9a9a;
  line-height: 1.2;
}

.customer-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 18px;
  font-size: 12px;
  color: #555;
}

.jobs-section {
  margin-top: 14px;
}

.section-title {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.vehicle-form-box {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ecece8;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #555;
}

@media (max-width: 900px) {
  .customer-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>