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

            <!-- 
            <div class="page-subtitle">
                View customer records, vehicles, and recent workshop activity
            </div>
            -->
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

      <!-- CUSTOMER DETAIL MODAL -->
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
            <div class="modal-header detail-modal-header">
              <div>
                <div class="detail-modal-title-row">
                  <span>{{ activeCustomer.name }}</span>

                  <span
                    v-if="activeCustomer.transactions_count > 0"
                    class="type-badge success"
                  >
                    Existing Customer
                  </span>
                </div>

                <p class="detail-modal-subtitle">
                  Customer contact details, vehicles, and recent workshop transactions.
                </p>
              </div>

              <button class="btn btn-sm btn-ghost" @click="closeDetail">✕</button>
            </div>

            <div class="modal-body modal-detail-body">
              <div class="part-kpi-grid">
                <div class="part-kpi-card">
                  <span>Total Visits</span>
                  <strong>{{ activeCustomer.transactions_count || 0 }}</strong>
                </div>

                <div class="part-kpi-card">
                  <span>Total Spent</span>
                  <strong>RM {{ formatMoney(activeCustomer.transactions_sum_total_amount) }}</strong>
                </div>

                <div class="part-kpi-card">
                  <span>Vehicles</span>
                  <strong>{{ activeCustomer.vehicles?.length || 0 }}</strong>
                </div>
              </div>

              <div class="detail-section-card">
                <div class="detail-section-title">Customer Information</div>

                <div class="compact-detail-list">
                  <div class="compact-detail-row">
                    <span>Phone</span>
                    <strong>{{ activeCustomer.phone || "-" }}</strong>
                  </div>

                  <div class="compact-detail-row">
                    <span>Email</span>
                    <strong>{{ activeCustomer.email || "-" }}</strong>
                  </div>

                  <div class="compact-detail-row">
                    <span>Address</span>
                    <strong>{{ activeCustomer.address || "-" }}</strong>
                  </div>
                </div>
              </div>

              <div class="detail-section-card">
                <div class="detail-section-title">Vehicles</div>

                <div
                  v-if="activeCustomer.vehicles && activeCustomer.vehicles.length > 0"
                  class="detail-card-list"
                >
                  <div
                    v-for="vehicle in activeCustomer.vehicles"
                    :key="vehicle.id"
                    class="detail-list-card"
                  >
                    <div class="detail-list-title">
                      {{ vehicle.license_plate || "-" }}
                    </div>

                    <div class="detail-list-meta">
                      {{ vehicle.make || "-" }} {{ vehicle.model || "" }}
                      <span v-if="vehicle.year"> · {{ vehicle.year }}</span>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-small">
                  No vehicles found
                </div>
              </div>

              <div class="detail-section-card">
                <div class="detail-section-title">Recent Transactions</div>

                <div
                  v-if="activeCustomer.transactions && activeCustomer.transactions.length > 0"
                  class="detail-card-list"
                >
                  <div
                    v-for="trx in activeCustomer.transactions"
                    :key="trx.id"
                    class="detail-list-card customer-trx-card"
                  >
                    <div>
                      <div class="detail-list-title">
                        {{ trx.document_number || "-" }}
                      </div>

                      <div class="detail-list-meta">
                        {{ trx.vehicle?.license_plate || "-" }} · {{ trx.status || "-" }}
                      </div>
                    </div>

                    <strong class="customer-trx-amount">
                      RM {{ formatMoney(trx.total_amount) }}
                    </strong>
                  </div>
                </div>

                <div v-else class="empty-small">
                  No recent transactions
                </div>
              </div>
            </div>

            <div class="modal-footer customer-detail-footer">
              <div class="customer-detail-actions-left">
                <button
                  type="button"
                  class="btn btn-secondary btn-pill"
                  @click="openWhatsApp(activeCustomer)"
                >
                  WhatsApp
                </button>

                <button
                  type="button"
                  class="btn btn-secondary btn-pill"
                  @click="openFormModal(activeCustomer)"
                >
                  Edit
                </button>

                <button
                  type="button"
                  class="btn btn-danger-light btn-pill"
                  @click="openDeleteModal(activeCustomer)"
                >
                  Delete
                </button>
              </div>

              <button
                type="button"
                class="btn btn-primary btn-pill"
                @click="viewCustomerTransactions(activeCustomer)"
              >
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

  <!-- DELETE CONFIRMATION MODAL -->
  <Teleport to="body">
    <div
      v-if="showDeleteModal"
      class="modal"
      @click.self="closeDeleteModal"
    >
      <div class="modal-card danger-confirm-card">
        <div class="danger-confirm-body">
          <div class="danger-confirm-icon">!</div>

          <div class="danger-confirm-title">Delete customer?</div>

          <div class="danger-confirm-message">
            Are you sure you want to delete
            <strong>{{ customerToDelete?.name || "this customer" }}</strong>?
            This action cannot be undone.
          </div>
        </div>

        <div class="danger-confirm-footer">
          <button
            type="button"
            class="btn btn-secondary btn-pill"
            :disabled="deletingCustomer"
            @click="closeDeleteModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-danger btn-pill"
            :disabled="deletingCustomer"
            @click="confirmDeleteCustomer"
          >
            {{ deletingCustomer ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ADD/EDIT CUSTOMER FORM MODAL -->
  <Teleport to="body">
    <div v-if="showFormModal" class="modal" @click.self="closeFormModal">
      <div class="modal-card form-dialog-card">
        <div class="form-dialog-header">
          <div>
            <div class="form-dialog-title">
              {{ editingCustomerId ? "Edit customer" : "Add customer" }}
            </div>

            <p class="form-dialog-subtitle">
              {{ editingCustomerId ? "Update customer contact information." : "Create a new customer profile for workshop transactions." }}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-sm btn-ghost"
            @click="closeFormModal"
          >
            ✕
          </button>
        </div>

        <div class="form-dialog-body">
          <div class="form-dialog-section">
            <div class="form-dialog-section-title">Customer Information</div>

            <div class="form-grid form-grid-compact">
              <div class="form-field">
                <label>Name</label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Customer name"
                />
              </div>

              <div class="form-field">
                <label>Phone</label>
                <input
                  v-model="form.phone"
                  type="text"
                  placeholder="Phone number"
                />
              </div>

              <div class="form-field">
                <label>Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="Email address"
                />
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
          </div>

          <div v-if="!editingCustomerId" class="form-dialog-section customer-vehicle-section">
            <div class="form-dialog-section-title">Vehicle Information</div>

            <label class="checkbox-row">
              <input v-model="form.add_vehicle" type="checkbox" />
              <span>Add vehicle now</span>
            </label>

            <div
              v-if="form.add_vehicle"
              class="form-grid form-grid-compact vehicle-form-grid"
            >
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

          <div
            v-if="formError"
            class="page-error"
            style="margin-top: 12px;"
          >
            {{ formError }}
          </div>
        </div>

        <div class="form-dialog-footer">
          <button
            type="button"
            class="btn btn-secondary btn-pill"
            :disabled="savingForm"
            @click="closeFormModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="btn btn-primary btn-pill"
            :disabled="savingForm"
            @click="submitCustomer"
          >
            {{ savingForm ? "Saving..." : editingCustomerId ? "Update" : "Create" }}
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
  font-weight: 700;
  color: #171717;
  line-height: 1.2;
}

.cust-meta {
  font-size: 11px;
  color: #9a9a9a;
  line-height: 1.2;
}

/* Skeleton loading */
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

.customer-detail-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.customer-detail-actions-left {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}

.customer-detail-footer .btn {
  min-width: 96px;
}

.customer-detail-footer > .btn-primary {
  min-width: 150px;
}

.customer-trx-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.customer-trx-amount {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
}

@keyframes skeleton {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 640px) {
  .customer-detail-footer {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .customer-detail-actions-left {
    flex-direction: column;
    align-items: stretch;
  }

  .customer-detail-footer .btn {
    width: 100%;
  }
}
</style>