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
      <div class="page-header">
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

            <div class="page-subtitle">
                View customer records, vehicles, and recent workshop activity
            </div>
          </div>

          <div class="page-actions">
          <input
              class="search-input"
              v-model.trim="searchQuery"
              placeholder="Search customer..."
          />
          <button
            class="btn btn-secondary btn-pill"
            type="button"
            :disabled="exporting"
            @click="exportCustomers"
          >
            {{ exporting ? "Exporting..." : "Export" }}
          </button>
          <button class="btn btn-primary btn-pill" type="button" @click="openFormModal()">
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
                  <span :class="['badge', customerStatusClass(cust)]">
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
        <div v-if="detailLoading" class="modal-card large">
  <div class="modal-header">
    <span>Customer Details</span>
    <button class="btn btn-sm btn-ghost" @click="closeDetail">✕</button>
  </div>

  <div class="modal-body">
    <div class="skeleton-line title"></div>
    <div class="skeleton-grid">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
    <div class="skeleton-line wide"></div>
    <div class="skeleton-line wide"></div>
  </div>
</div>

        <div v-else class="modal-card large">
          <div class="modal-header">
            <span>{{ activeCustomer.name }}</span>
            <button class="btn btn-sm btn-ghost" @click="closeDetail">✕</button>
          </div>

          <div class="modal-body modal-detail-body">
          <!-- CUSTOMER INFO -->
          <div class="detail-section customer-info-section">
          <div class="section-title">Customer Information</div>

          <div class="customer-info-list">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">Phone</span>
                <span class="info-value">{{ activeCustomer.phone || "-" }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">{{ activeCustomer.email || "-" }}</span>
              </div>
          
              <div class="info-item">
                <span class="info-label">Address</span>
                <span class="info-value">{{ activeCustomer.address || "-" }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Total Visits</span>
                <span class="info-value">{{ activeCustomer.transactions_count || 0 }}</span>
              </div>

              <div class="info-item">
                <span class="info-label">Total Spent</span>
                <span class="info-value">
                  RM {{ formatMoney(activeCustomer.transactions_sum_total_amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>

          <!-- VEHICLES -->
          <div class="detail-section">
            <div class="section-title">Vehicles</div>

            <div
              v-for="vehicle in activeCustomer.vehicles || []"
              :key="vehicle.id"
              class="detail-list-item"
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

          <!-- RECENT TRANSACTIONS -->
          <div class="detail-section">
            <div class="section-title">Recent Transactions</div>

            <div
              v-for="trx in activeCustomer.transactions || []"
              :key="trx.id"
              class="detail-list-item"
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

          <div class="modal-actions split">
            <div class="left-actions">
              <button @click="openWhatsApp(activeCustomer)">WhatsApp</button>
              <button @click="openFormModal(activeCustomer)">Edit</button>
              <button class="btn-primary" @click="viewCustomerTransactions(activeCustomer)">
                View Transactions
              </button>
            </div>

          <button class="btn btn-danger-light" @click="openDeleteModal(activeCustomer)">
            Delete
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
  <div
    v-if="showDeleteModal"
    class="delete-modal-overlay"
    @click.self="closeDeleteModal"
  >
    <div class="delete-modal-card">
      <div class="delete-icon">!</div>

      <div class="delete-title">
        Delete customer?
      </div>

      <div class="delete-message">
        Are you sure you want to delete
        <strong>{{ customerToDelete?.name }}</strong>?
        This action cannot be undone.
      </div>

      <div class="delete-actions">
        <button
          type="button"
          class="delete-cancel"
          :disabled="deletingCustomer"
          @click="closeDeleteModal"
        >
          Cancel
        </button>

        <button
          type="button"
          class="delete-confirm"
          :disabled="deletingCustomer"
          @click="confirmDeleteCustomer"
        >
          {{ deletingCustomer ? "Deleting..." : "Delete" }}
        </button>
      </div>
    </div>
  </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="showFormModal" class="modal" @click.self="closeFormModal">
      <div class="modal-card large">
        <div class="modal-header">
          <span>{{ editingCustomerId ? "Edit Customer" : "Add Customer" }}</span>
          <button type="button" class="btn btn-sm btn-ghost" @click="closeFormModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-field">
              <label>Name</label>
              <input v-model="form.name" type="text" placeholder="Customer name" />
            </div>

            <div class="form-field">
              <label>Phone</label>
              <input v-model="form.phone" type="text" placeholder="Phone number" />
            </div>

            <div class="form-field">
              <label>Email</label>
              <input v-model="form.email" type="email" placeholder="Email address" />
            </div>

            <div class="form-field full">
              <label>Address</label>
              <textarea
                v-model="form.address"
                rows="3"
                placeholder="Customer address"
              ></textarea>
            </div>
          </div>

          <div v-if="!editingCustomerId" class="form-subsection">
            <div class="section-title">Vehicle Information</div>

            <label class="checkbox-row">
              <input v-model="form.add_vehicle" type="checkbox" />
              <span>Add vehicle now</span>
            </label>

            <div v-if="form.add_vehicle" class="form-grid" style="margin-top:12px;">
              <div class="form-field">
                <label>License Plate</label>
                <input
                  v-model="form.vehicle_license_plate"
                  type="text"
                  placeholder="e.g. ABC1234"
                />
              </div>

              <div class="form-field">
                <label>Make</label>
                <input
                  v-model="form.vehicle_make"
                  type="text"
                  placeholder="e.g. Toyota"
                />
              </div>

              <div class="form-field">
                <label>Model</label>
                <input
                  v-model="form.vehicle_model"
                  type="text"
                  placeholder="e.g. Vios"
                />
              </div>

              <div class="form-field">
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
            class="btn-primary"
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
      collapsed: localStorage.getItem("sidebar-collapsed") === "true",
      loading: false,
      detailLoading: false,
      error: "",

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
      exporting: false,
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
      showDeleteModal: false,
      customerToDelete: null,
      deletingCustomer: false,
      searchTimer: null,
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
    
    filteredCustomers() {
      return this.customers || [];
    }
  },

  mounted() {
    this.fetchCustomers();
  },

  methods: {
    getCacheKey(page = 1) {
      return `customers-${this.activeTab}-${this.searchQuery || "all"}-page-${page}`;
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
        const res = await api.get("/customers", {
          params: {
            page,
            status: this.activeTab,
            search: this.searchQuery || undefined,
          },
        });

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

    async exportCustomers() {
      this.exporting = true;
      this.error = "";

      try {
        const params = {
          search: this.searchQuery || undefined,
          status: this.activeTab || "all",
        };

        const response = await api.get("/customers/export/csv", {
          params,
          responseType: "blob",
        });

        const blob = new Blob([response.data], {
          type: "text/csv;charset=utf-8;",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.setAttribute("download", `customers-${new Date().toISOString().slice(0, 10)}.csv`);

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error exporting customers:", error);
        this.error =
          error.response?.data?.message || "Failed to export customers.";
      } finally {
        this.exporting = false;
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

    formatWhatsappNumber(phone) {
      if (!phone) return "";

      let cleaned = String(phone).trim();

      cleaned = cleaned.replace(/[\s\-()+]/g, "");

      // Local Malaysia number: 0193804822 -> 60193804822
      if (cleaned.startsWith("0")) {
        cleaned = "6" + cleaned;
      }

      // Excel removed leading 0: 193804822 -> 60193804822
      if (/^1\d{8,9}$/.test(cleaned)) {
        cleaned = "60" + cleaned;
      }

      // 0060193804822 -> 60193804822
      if (/^00601\d{8,9}$/.test(cleaned)) {
        cleaned = cleaned.slice(2);
      }

      return cleaned;
    },

    openWhatsApp(customer) {
      const plate = customer.vehicles?.[0]?.license_plate || "-";
      const msg = `Hi ${customer.name}, regarding your vehicle (${plate}), feel free to contact us for updates.`;

      const phone = this.formatWhatsappNumber(customer.phone);

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

      if (status === "invoice") return "badge-quotation";
      if (status === "quotation") return "badge-invoice";
      if (status === "receipt") return "badge-receipt";
      return "empty-inline";
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

        this.clearCustomersCache();
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

    openDeleteModal(customer) {
  this.customerToDelete = customer;
  this.showDeleteModal = true;
},

closeDeleteModal() {
  if (this.deletingCustomer) return;

  this.showDeleteModal = false;
  this.customerToDelete = null;
},

async confirmDeleteCustomer() {
  if (!this.customerToDelete) return;

  this.deletingCustomer = true;
  this.error = "";

  try {
    await api.delete(`/customers/${this.customerToDelete.id}`);

    this.showDeleteModal = false;
    this.customerToDelete = null;

    this.closeDetail();

    this.clearCustomersCache();
    await this.fetchCustomers(this.page);
  } catch (error) {
    console.error("Failed to delete customer:", error);
    this.error =
      error.response?.data?.message || "Failed to delete customer.";
  } finally {
    this.deletingCustomer = false;
  }
},

  viewCustomerTransactions(customer) {
    this.closeDetail();
    this.$router.push(`/transactions?customer_id=${customer.id}`);
    },
  },

  clearCustomersCache() {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("customers-")) {
        sessionStorage.removeItem(key);
      }
    });
  },

  watch: {
    searchQuery() {
      clearTimeout(this.searchTimer);

      this.searchTimer = setTimeout(() => {
        this.page = 1;
        this.fetchCustomers(1);
      }, 350);
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

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #555;
}

/* skeleton loading styles */
.skeleton-line {
  height: 14px;
  border-radius: 999px;
  background: linear-gradient(90deg, #eee, #f7f7f7, #eee);
  background-size: 200% 100%;
  animation: skeleton 1.2s infinite;
}

.skeleton-line.title {
  width: 180px;
  height: 20px;
  margin-bottom: 24px;
}

.skeleton-line.wide {
  width: 100%;
  margin-top: 18px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 28px;
}

@keyframes skeleton {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* modal actions */
.modal-detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  border: 1px solid #eeeeee;
  border-radius: 16px;
  padding: 16px;
  background: #fff;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}

.customer-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 12px;
  color: #888;
}

.detail-item strong {
  font-size: 14px;
  color: #222;
  font-weight: 600;
}

.detail-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #f1f1f1;
}

.detail-list-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.detail-list-item:last-child {
  padding-bottom: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 700;
  color: #222;
}

.detail-list-item small {
  font-size: 12px;
  color: #666;
}

.job-price {
  font-size: 14px;
  font-weight: 700;
  color: #222;
  white-space: nowrap;
}

.empty-small {
  font-size: 13px;
  color: #999;
  padding: 8px 0;
}

.modal-actions.split {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 20px 18px;
  border-top: 1px solid #eeeeee;
}

.left-actions {
  display: flex;
  gap: 8px;
}

.modal-actions button {
  height: 38px;
  min-width: 92px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.modal-actions button.primary {
  min-width: 120px;
  background: #111;
  color: #fff;
  border-color: #111;
}

.modal-overlay {
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(3px);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 28px;
  margin-top: 16px;
}

.detail-item label {
  display: block;
  font-size: 11px;
  text-transform: uppercase;
  color: #999;
  margin-bottom: 4px;
}

.detail-item span {
  font-size: 14px;
  font-weight: 500;
  color: #222;
}

/* modal */
.modal-card.large {
  width: min(520px, calc(100vw - 32px));
  border-radius: 18px;
}

.modal-header {
  padding: 18px 42px 8px;
}

.modal-header span {
  font-size: 14.5px;
  font-weight: 700;
  color: #222;
}

.modal-body {
  padding: 10px 42px 14px;
}

.modal-detail-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-section {
  border: 1px solid #eeeeee;
  border-radius: 14px;
  padding: 12px 14px;
  background: #fff;
}

.section-title {
  font-size: 10px;
  font-weight: 700;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  margin-bottom: 10px;
}

.customer-info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 9px 0;
  border-top: 1px solid #f1f1f1;
}

.info-row:first-child {
  border-top: none;
  padding-top: 0;
}

.info-row.last {
  padding-bottom: 0;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.info-label {
  font-size: 10.5px;
  font-weight: 600;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 12.5px;
  font-weight: 600;
  color: #222;
  line-height: 1.25;
  word-break: break-word;
}

.detail-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 9px 0;
  border-top: 1px solid #f1f1f1;
}

.detail-list-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.item-name {
  font-size: 12.5px;
  font-weight: 700;
  color: #222;
}

.detail-list-item small {
  font-size: 11.5px;
  color: #666;
}

.job-price {
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
}

/* delete modal */
.delete-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(1.5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.delete-modal-card {
  width: min(360px, calc(100vw - 32px));
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
  text-align: center;
}

.delete-icon {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #fff1f0;
  color: #b42318;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 18px;
  font-weight: 800;
}

.delete-title {
  font-size: 16px;
  font-weight: 700;
  color: #171717;
  margin-bottom: 8px;
}

.delete-message {
  font-size: 13px;
  line-height: 1.5;
  color: #666;
  margin-bottom: 20px;
}

.delete-message strong {
  color: #222;
  font-weight: 700;
}

.delete-actions {
  display: flex;
  gap: 10px;
}

.delete-actions button {
  flex: 1;
  height: 38px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.delete-cancel {
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
}

.delete-confirm {
  border: 1px solid #b42318;
  background: #b42318;
  color: #fff;
}

.delete-actions button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.empty-inline {
  font-size: 11.5px;
  color: #aaa;
  font-style: italic;
  white-space: nowrap;
}

.modal-actions {
  display: flex;
  gap: 10px;
  padding: 14px 42px 20px;
  border-top: 1px solid #eeeeee;
  background: #fff;
}

.modal-actions button {
  flex: 1;
  height: 38px;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.modal-actions button.primary {
  background: #111;
  color: #fff;
  border-color: #111;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 14px 0 10px;
  font-size: 12.5px;
  font-weight: 500;
  color: #444;
}

.checkbox-row input {
  width: 14px;
  height: 14px;
}

@media (max-width: 900px) {
  .customer-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>