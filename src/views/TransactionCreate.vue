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
      <div class="page-header transaction-page-header">
        <div class="page-intro">
          <div class="page-title">
            {{ isEditMode ? "Edit Transaction" : "New Transaction" }}
          </div>

          <div class="page-subtitle">
            {{
              isEditMode
                ? "Update transaction details, items, discount, and notes"
                : "Create quotation for customer vehicle service"
            }}
          </div>
        </div>

        <div class="page-actions">
          <router-link to="/transactions" class="btn btn-secondary btn-pill link-btn">
            Back
          </router-link>
        </div>
      </div>

      <!-- STEPPER -->
      <div v-if="!isEditMode" class="flow-steps">
        <div
          class="flow-step"
          :class="{
            active: !form.customer_id || !form.vehicle_id,
            done: form.customer_id && form.vehicle_id
          }"
        >
          <span class="flow-number">1</span>
          <span class="flow-text">Select customer</span>
        </div>

        <div class="flow-line"></div>

        <div
          class="flow-step"
          :class="{
            active: form.customer_id && form.vehicle_id && form.items.length === 0,
            done: form.items.length > 0
          }"
        >
          <span class="flow-number">2</span>
          <span class="flow-text">Add items</span>
        </div>

        <div class="flow-line"></div>

        <div
          class="flow-step"
          :class="{
            active: form.items.length > 0
          }"
        >
          <span class="flow-number">3</span>
          <span class="flow-text">Review quotation</span>
        </div>
      </div>

      <div v-else class="edit-context">
        <span class="edit-pill">Editing transaction</span>
        <span class="edit-note">
          Update details, items, discount, or notes before saving.
        </span>
      </div>

      <!-- WORKSPACE -->
      <div class="transaction-workspace">
        <!-- MAIN COLUMN -->
        <div class="transaction-main">
          <!-- CUSTOMER & VEHICLE -->
          <Card class="workflow-card">
            <template #header>
              <div class="section-heading">
                <div
                  class="section-index"
                  :class="{
                    active: !form.customer_id || !form.vehicle_id,
                    done: form.customer_id && form.vehicle_id
                  }"
                >
                  1
                </div>
                <div>
                  <span class="card-title">Customer & Vehicle</span>
                  <p class="section-caption">Select the customer and vehicle for this quotation.</p>
                </div>
              </div>
            </template>

            <div class="customer-vehicle-grid">
              <div class="form-field">
                <label>Customer</label>
                <select v-model="form.customer_id" @change="handleCustomerChange">
                  <option value="">Select customer</option>
                  <option
                    v-for="customer in customers"
                    :key="customer.id"
                    :value="customer.id"
                  >
                    {{ customer.name }}
                  </option>
                </select>
              </div>

              <div class="form-field">
                <label>Vehicle</label>
                <select
                  v-model="form.vehicle_id"
                  :disabled="!form.customer_id"
                  @change="handleVehicleChange"
                >
                  <option value="">Select vehicle</option>
                  <option
                    v-for="vehicle in vehicles"
                    :key="vehicle.id"
                    :value="vehicle.id"
                  >
                    {{ vehicle.license_plate }} — {{ vehicle.make }} {{ vehicle.model }}
                    {{ vehicle.year ? `(${vehicle.year})` : "" }}
                  </option>
                </select>
              </div>
            </div>

            <div v-if="selectedVehicle" class="vehicle-summary">
              <div class="vehicle-summary-item">
                <span>Plate</span>
                <strong>{{ selectedVehicle.license_plate }}</strong>
              </div>

              <div class="vehicle-summary-item">
                <span>Make / Model</span>
                <strong>{{ selectedVehicle.make }} {{ selectedVehicle.model }}</strong>
              </div>

              <div class="vehicle-summary-item">
                <span>Year</span>
                <strong>{{ selectedVehicle.year || "-" }}</strong>
              </div>
            </div>
          </Card>

          <!-- COMPATIBLE PARTS -->
          <Card class="workflow-card compatible-parts-card">
            <template #header>
              <div class="section-heading">
                <div
                  class="section-index"
                  :class="{
                    pending: !form.customer_id || !form.vehicle_id,
                    active: form.customer_id && form.vehicle_id && form.items.length === 0,
                    done: form.items.length > 0
                  }"
                >
                  2
                </div>
                <div>
                  <span class="card-title">Available Compatible Parts</span>
                  <p class="section-caption">Click a part to add it into the quotation.</p>
                </div>
              </div>

              <span class="section-count">{{ compatibleParts.length }} items</span>
            </template>

            <div class="compatible-parts-body">
              <div v-if="!form.vehicle_id" class="setup-panel">
                <div class="setup-icon">
                  <svg viewBox="0 0 24 24" class="setup-svg">
                    <path d="M4 17h16" />
                    <path d="M6 17l1.3-5.2A3 3 0 0 1 10.2 9h3.6a3 3 0 0 1 2.9 2.8L18 17" />
                    <path d="M7 17v2" />
                    <path d="M17 17v2" />
                    <path d="M9 13h6" />
                  </svg>
                </div>

                <div class="setup-content">
                  <strong>Select a vehicle first</strong>
                  <p>
                    Compatible parts will appear after choosing a customer and vehicle.
                    This helps prevent adding parts that may not fit the selected car.
                  </p>

                  <div class="setup-hints">
                    <span>Customer</span>
                    <span>Vehicle</span>
                    <span>Compatible parts</span>
                  </div>
                </div>
              </div>

              <div v-else-if="compatibleParts.length === 0" class="setup-panel warning-panel">
                <div class="setup-icon">
                  <svg viewBox="0 0 24 24" class="setup-svg">
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 4.3L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
                  </svg>
                </div>

                <div class="setup-content">
                  <strong>No compatible parts found</strong>
                  <p>
                    No matching inventory item was found for this vehicle.
                    You can still continue by adding a manual service item.
                  </p>

                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    @click="addServiceItem"
                  >
                    + Add Service
                  </button>
                </div>
              </div>

              <div v-else class="parts-list">
                <button
                  v-for="part in compatibleParts"
                  :key="part.id"
                  type="button"
                  class="part-row"
                  @click="addPartItem(part)"
                >
                  <div class="part-left">
                    <div class="part-icon">
                      <svg viewBox="0 0 24 24" class="part-svg">
                        <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-3-3 2.4-2.4Z" />
                      </svg>
                    </div>

                    <div class="part-copy">
                      <div class="part-name">
                        {{ part.name }}
                        <span v-if="part.variant">— {{ part.variant }}</span>
                      </div>

                      <div class="part-meta">
                        {{ part.sku || "-" }} · Stock: {{ part.stock }} ·
                        {{ part.is_generic ? "Generic" : "Specific" }}
                      </div>
                    </div>
                  </div>

                  <div class="part-right">
                    <div class="part-price">RM {{ formatMoney(part.selling_price) }}</div>
                    <span class="part-add">Add</span>
                  </div>
                </button>
              </div>
            </div>
          </Card>

          <!-- TRANSACTION ITEMS -->
          <Card class="workflow-card">
            <template #header>
              <div class="section-heading">
                <div
                  class="section-index"
                  :class="{
                    pending: form.items.length === 0,
                    active: form.items.length > 0
                  }"
                >
                  3
                </div>
                <div>
                  <span class="card-title">Transaction Items</span>
                  <p class="section-caption">Review selected parts and service charges.</p>
                </div>
              </div>

              <button
                class="btn btn-secondary btn-pill"
                type="button"
                @click="addServiceItem"
              >
                + Add Service
              </button>
            </template>

            <div v-if="form.items.length === 0" class="setup-panel items-empty-panel">
              <div class="setup-icon">
                <svg viewBox="0 0 24 24" class="setup-svg">
                  <path d="M8 6h13" />
                  <path d="M8 12h13" />
                  <path d="M8 18h13" />
                  <path d="M3 6h.01" />
                  <path d="M3 12h.01" />
                  <path d="M3 18h.01" />
                </svg>
              </div>

              <div class="setup-content">
                <strong>No transaction items added</strong>
                <p>
                  Add a compatible part from the list above, or create a manual labour
                  or service item for this quotation.
                </p>

                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  @click="addServiceItem"
                >
                  + Add manual service
                </button>
              </div>
            </div>

            <div v-else class="items-list">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="item-card"
                :class="item.item_type === 'part' ? 'part-card' : 'service-card'"
              >
                <div class="item-top">
                  <div class="item-title-group">
                    <span
                      class="item-type-badge"
                      :class="item.item_type === 'part' ? 'badge-part' : 'badge-service'"
                    >
                      {{ item.item_type === "part" ? "Part" : "Service" }}
                    </span>

                    <div>
                      <div class="item-title">
                        {{
                          item.item_type === "part"
                            ? item.part_label
                            : (item.service_name || "Unnamed service")
                        }}
                      </div>

                      <div class="item-sub">
                        {{ item.item_type === "part" ? "Inventory item" : "Manual labour/service" }}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    class="btn btn-sm btn-ghost"
                    @click="removeItem(index)"
                  >
                    Remove
                  </button>
                </div>

                <!-- PART ITEM -->
                <div v-if="item.item_type === 'part'" class="part-compact-layout">
                  <div class="compact-inputs">
                    <div class="form-field form-field-sm">
                      <label>Qty</label>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        step="1"
                      />
                    </div>

                    <div class="form-field form-field-sm">
                      <label>Unit Price</label>
                      <input
                        v-model.number="item.selling_price"
                        type="number"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div class="form-field form-field-sm compact-note">
                      <label>Note</label>
                      <input
                        v-model="item.note"
                        type="text"
                        placeholder="Optional note"
                      />
                    </div>

                    <div class="compact-total-card">
                      <span>Total</span>
                      <strong>RM {{ formatMoney(lineTotal(item)) }}</strong>
                    </div>
                  </div>
                </div>

                <!-- SERVICE ITEM -->
                <div v-else class="service-item-layout">
                  <div class="service-grid">
                    <div class="form-field form-field-sm full">
                      <label>Service name</label>
                      <input
                        v-model="item.service_name"
                        type="text"
                        placeholder="e.g. Brake service, inspection, labour charge"
                      />
                    </div>

                    <div class="form-field form-field-sm">
                      <label>Duration (hrs)</label>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="0.1"
                        step="0.1"
                        placeholder="e.g. 1.5"
                      />
                    </div>

                    <div class="form-field form-field-sm">
                      <label>Rate (RM/hr)</label>
                      <input
                        v-model.number="item.selling_price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 80"
                      />
                    </div>

                    <div class="form-field form-field-sm full">
                      <label>Note</label>
                      <input
                        v-model="item.note"
                        type="text"
                        placeholder="Optional service note"
                      />
                    </div>
                  </div>

                  <div class="line-total-bar">
                    <span>Line total</span>
                    <strong>RM {{ formatMoney(lineTotal(item)) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <!-- NOTES -->
          <Card class="workflow-card">
            <template #header>
              <div class="section-heading">
                <div
                  class="section-index"
                  :class="{
                    pending: form.items.length === 0,
                    muted: form.items.length > 0
                  }"
                >
                  4
                </div>
                <div>
                  <span class="card-title">Notes</span>
                  <p class="section-caption">Optional remarks shown internally or on quotation.</p>
                </div>
              </div>
            </template>

            <div class="form-field">
              <label>Transaction notes</label>
              <textarea
                v-model="form.notes"
                rows="4"
                placeholder="Optional remarks for quotation"
              ></textarea>
            </div>
          </Card>
        </div>

        <!-- RIGHT SUMMARY -->
        <aside class="transaction-side">
          <Card class="sticky-summary-card">
            <template #header>
              <span class="card-title">Summary</span>
            </template>

            <div class="summary-box">
              <div class="summary-progress">
                <div class="summary-progress-title">Ready to save</div>

                <div
                  class="summary-check"
                  :class="{ done: form.customer_id && form.vehicle_id }"
                >
                  <span></span>
                  <p>Customer and vehicle selected</p>
                </div>

                <div
                  class="summary-check"
                  :class="{ done: form.items.length > 0 }"
                >
                  <span></span>
                  <p>At least one item added</p>
                </div>

                <div
                  class="summary-check"
                  :class="{ done: totalAfterDiscount > 0 }"
                >
                  <span></span>
                  <p>Total amount calculated</p>
                </div>
              </div>

              <div class="summary-box-row">
                <span>Subtotal</span>
                <strong>RM {{ formatMoney(subtotal) }}</strong>
              </div>

              <div class="summary-discount-row">
                <label>Discount amount</label>
                <input
                  v-model.number="form.discount_amount"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>

              <div class="summary-box-row summary-box-total">
                <span>Total</span>
                <strong>RM {{ formatMoney(totalAfterDiscount) }}</strong>
              </div>
            </div>

            <div class="summary-actions">
              <button
                type="button"
                class="btn btn-secondary btn-pill"
                @click="resetForm"
              >
                Reset
              </button>

              <button
                class="btn btn-primary btn-pill"
                type="button"
                :disabled="saving || !canSubmit"
                @click="submitTransaction"
              >
                {{
                  saving
                    ? "Saving..."
                    : (isEditMode ? "Update Transaction" : "Save Quotation")
                }}
              </button>
            </div>

            <p v-if="error" class="error-text">{{ error }}</p>
          </Card>
        </aside>
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
      collapsed: localStorage.getItem("sidebar-collapsed") === "true",
      customers: [],
      vehicles: [],
      compatibleParts: [],
      selectedVehicle: null,
      loadingCustomers: false,
      loadingVehicles: false,
      loadingParts: false,
      saving: false,
      error: "",

      form: {
        customer_id: "",
        vehicle_id: "",
        discount_amount: 0,
        notes: "",
        items: [],
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

    subtotal() {
      return this.form.items.reduce((sum, item) => sum + this.lineTotal(item), 0);
    },

    totalAfterDiscount() {
      return Math.max(0, this.subtotal - Number(this.form.discount_amount || 0));
    },

    canSubmit() {
      return (
        this.form.customer_id &&
        this.form.vehicle_id &&
        this.form.items.length > 0 &&
        this.form.items.every((item) => {
          if (item.item_type === "part") {
            return item.part_id && item.quantity > 0 && item.selling_price >= 0;
          }

          return item.service_name && item.quantity > 0 && item.selling_price >= 0;
        })
      );
    },

    isEditMode() {
        return !!this.$route.params.id;
    },

    transactionId() {
        return this.$route.params.id || null;
    },
  },

  async mounted() {
    await this.fetchCustomers();

    if (this.isEditMode) {
      await this.loadTransactionForEdit();
    } else {
      await this.applyOnlineRequestPrefill();
    }
  },

  methods: {
    async fetchCustomers() {
      this.loadingCustomers = true;
      try {
        const res = await api.get("/customers");
        this.customers = res.data.data || res.data;
      } catch (err) {
        console.error("Failed to load customers", err);
      } finally {
        this.loadingCustomers = false;
      }
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

    async applyOnlineRequestPrefill() {
      const customerId = this.$route.query.customer_id;
      const vehicleId = this.$route.query.vehicle_id;
      const requestId = this.$route.query.request_id;

      if (!customerId) return;

      this.form.customer_id = Number(customerId);

      await this.fetchVehicles(customerId);

      if (vehicleId) {
        this.form.vehicle_id = Number(vehicleId);

        this.selectedVehicle =
          this.vehicles.find((v) => Number(v.id) === Number(vehicleId)) || null;

        await this.fetchCompatibleParts(vehicleId);
      }

    if (requestId) {
      try {
        const res = await api.get(`/online-requests/${requestId}`);

        const onlineRequest = res.data;

        this.form.notes = `Customer reported issue:
        ${onlineRequest.problem_description || "-"}

        Created from online request #${requestId}`;
          } catch (error) {
            console.error("Failed to load online request", error);

            this.form.notes = `Created from online request #${requestId}`;
          }
        }
    },

    async handleCustomerChange() {
      this.form.vehicle_id = "";
      this.vehicles = [];
      this.compatibleParts = [];
      this.selectedVehicle = null;
      this.form.items = [];

      if (!this.form.customer_id) return;

      await this.fetchVehicles(this.form.customer_id);
    },

    async fetchVehicles(customerId) {
      this.loadingVehicles = true;
      try {
        const res = await api.get("/vehicles", {
        params: {
            customer_id: customerId,
            all: 1,
        },
        });

        this.vehicles = res.data || [];
      } catch (err) {
        console.error("Failed to load vehicles", err);
      } finally {
        this.loadingVehicles = false;
      }
    },

    async handleVehicleChange() {
      this.compatibleParts = [];
      this.form.items = [];
      this.selectedVehicle =
        this.vehicles.find((v) => Number(v.id) === Number(this.form.vehicle_id)) || null;

      if (!this.form.vehicle_id) return;

      await this.fetchCompatibleParts(this.form.vehicle_id);
    },

    async fetchCompatibleParts(vehicleId) {
      this.loadingParts = true;
      try {
        const res = await api.get(`/parts/compatible/${vehicleId}`);
        this.compatibleParts = res.data || [];
      } catch (err) {
        console.error("Failed to load compatible parts", err);
      } finally {
        this.loadingParts = false;
      }
    },

    async loadTransactionForEdit() {
    this.saving = true;
    this.error = "";

    try {
        const res = await api.get(`/transactions/${this.transactionId}`);
        const trx = res.data;

        this.form.customer_id = trx.customer_id;
        await this.fetchVehicles(trx.customer_id);

        this.form.vehicle_id = trx.vehicle_id;
        this.selectedVehicle =
        this.vehicles.find((v) => Number(v.id) === Number(trx.vehicle_id)) || null;

        if (trx.vehicle_id) {
        await this.fetchCompatibleParts(trx.vehicle_id);
        }

        this.form.discount_amount = Number(trx.discount_amount || 0);
        this.form.notes = trx.notes || "";

        this.form.items = (trx.items || []).map((item) => ({
        item_type: item.item_type,
        part_id: item.item_type === "part" ? item.part_id : null,
        part_label:
            item.item_type === "part"
            ? `${item.part?.name || "Part"}${item.part?.variant ? " — " + item.part.variant : ""}`
            : null,
        service_name: item.item_type === "service" ? item.service_name : "",
        quantity: Number(item.quantity || 1),
        selling_price: Number(item.selling_price || 0),
        note: item.note || "",
        }));
    } catch (err) {
        console.error("Failed to load transaction for edit", err);
        this.error =
        err.response?.data?.message || "Failed to load transaction for editing.";
    } finally {
        this.saving = false;
    }
    },

    addPartItem(part) {
      this.form.items.push({
        item_type: "part",
        part_id: part.id,
        part_label: `${part.name}${part.variant ? " — " + part.variant : ""}`,
        service_name: null,
        quantity: 1,
        selling_price: Number(part.selling_price || 0),
        note: "",
      });
    },

    addServiceItem() {
      this.form.items.push({
        item_type: "service",
        part_id: null,
        part_label: null,
        service_name: "",
        quantity: 1,
        selling_price: 0,
        note: "",
      });
    },

    removeItem(index) {
      this.form.items.splice(index, 1);
    },

    lineTotal(item) {
      return Number(item.quantity || 0) * Number(item.selling_price || 0);
    },

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    resetForm() {
      this.form = {
        customer_id: "",
        vehicle_id: "",
        discount_amount: 0,
        notes: "",
        items: [],
      };
      this.vehicles = [];
      this.compatibleParts = [];
      this.selectedVehicle = null;
      this.error = "";
    },

    async submitTransaction() {
    this.error = "";
    this.saving = true;

    try {
        const payload = {
        customer_id: Number(this.form.customer_id),
        vehicle_id: Number(this.form.vehicle_id),
        discount_amount: Number(this.form.discount_amount || 0),
        notes: this.form.notes,
        online_request_id: this.$route.query.request_id || null,
        items: this.form.items.map((item) => ({
            item_type: item.item_type,
            part_id: item.item_type === "part" ? item.part_id : null,
            service_name: item.item_type === "service" ? item.service_name : null,
            quantity: Number(item.quantity || 1),
            selling_price: Number(item.selling_price || 0),
            note: item.note || null,
        })),
        };

        let res;

        if (this.isEditMode) {
        res = await api.put(`/transactions/${this.transactionId}`, payload);
        this.$router.push(`/transactions/${this.transactionId}`);
        } else {
        res = await api.post("/transactions", payload);
        const createdId = res.data.id || res.data.transaction?.id;
        this.$router.push(`/transactions/${createdId}`);
        }
    } catch (err) {
        if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0];
        this.error = Array.isArray(firstError)
            ? firstError[0]
            : "Validation failed.";
        } else {
        this.error =
            err.response?.data?.message ||
            "Failed to save transaction. Please check the form.";
        }
    } finally {
        this.saving = false;
    }
    },
  },
};
</script>

<style scoped>
/* ================================
   TRANSACTION CREATE / EDIT
================================ */

.transaction-page-header {
  margin-bottom: 10px;
}

.transaction-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 22px;
  align-items: start;
}

.transaction-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.transaction-side {
  position: sticky;
  top: 28px;
  align-self: start;
}

.workflow-card {
  overflow: hidden;
}

/* ================================
   CARD HEADER / SECTION STYLE
================================ */

.section-heading {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  min-width: 0;
}

.section-index {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 10.5px;
  font-weight: 850;
  border: 1px solid #dfe5ee;
  background: #f1f5f9;
  color: #94a3b8;
  box-shadow: none;
}

.section-index.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
  box-shadow: none;
}

.section-index.done {
  background: #f0fdf4;
  border-color: #d7f0df;
  color: #1f8f4d;
  font-size: 0;
}

.section-index.done::before {
  content: "✓";
  font-size: 11px;
  font-weight: 900;
}

.section-index.pending,
.section-index.muted {
  background: #f8fafc;
  color: #a8b2c0;
  border-color: #e3e9f2;
  box-shadow: none;
}

.section-caption {
  margin-top: 3px;
  font-size: 11.8px;
  color: #8a96a8;
  line-height: 1.35;
}

.section-count {
  font-size: 12px;
  color: #8a96a8;
  white-space: nowrap;
}

/* ================================
   STEPPER
================================ */

.flow-steps {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-top: 14px;
  margin-bottom: 16px;
  padding: 7px 9px;
  background: #ffffff;
  border: 1px solid #dfe5ee;
  border-radius: 999px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.flow-step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #9aa4b2;
  font-size: 12px;
  font-weight: 750;
  white-space: nowrap;
}

.flow-number {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #f1f5f9;
  border: 1px solid #dfe5ee;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 850;
}

.flow-step.active {
  color: #0f172a;
}

.flow-step.active .flow-number {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

.flow-step.done {
  color: #166534;
}

.flow-step.done .flow-number {
  background: #ecfdf3;
  border-color: #bbf7d0;
  color: #15803d;
  font-size: 0;
}

.flow-step.done .flow-number::before {
  content: "✓";
  font-size: 12px;
  font-weight: 900;
}

.flow-line {
  width: 32px;
  height: 1px;
  background: #dfe5ee;
}

/* Edit mode pill */
.edit-context {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  margin-bottom: 16px;
  padding: 7px 10px;
  background: #ffffff;
  border: 1px solid #dfe5ee;
  border-radius: 999px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

.edit-pill {
  padding: 6px 10px;
  border-radius: 999px;
  background: #0f172a;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 750;
}

.edit-note {
  font-size: 12px;
  color: #8a96a8;
  padding-right: 4px;
}

/* ================================
   CUSTOMER / VEHICLE
================================ */

.customer-vehicle-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.vehicle-summary {
  margin-top: 14px;
  padding: 0;
  border: 1px solid #e1e7ef;
  border-radius: 13px;
  background: #f8fafc;
  overflow: hidden;
}

.vehicle-summary-item {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 11px 14px;
  border-bottom: 1px solid #e5eaf1;
  font-size: 12.5px;
}

.vehicle-summary-item:last-child {
  border-bottom: none;
}

.vehicle-summary-item span {
  color: #64748b;
  font-weight: 650;
}

.vehicle-summary-item strong {
  color: #0f172a;
  font-weight: 800;
  text-align: right;
}

/* ================================
   COMPATIBLE PARTS
================================ */

.compatible-parts-card {
  min-height: 230px;
}

.compatible-parts-body {
  max-height: 320px;
  min-height: 140px;
  overflow-y: auto;
  padding-right: 4px;
}

.compatible-parts-body::-webkit-scrollbar,
.parts-list::-webkit-scrollbar {
  width: 6px;
}

.compatible-parts-body::-webkit-scrollbar-thumb,
.parts-list::-webkit-scrollbar-thumb {
  background: #d8dee8;
  border-radius: 999px;
}

.compatible-parts-body::-webkit-scrollbar-track,
.parts-list::-webkit-scrollbar-track {
  background: transparent;
}

.parts-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.part-row {
  width: 100%;
  min-height: 62px;
  padding: 12px 13px;
  border: 1px solid #e1e7ef;
  border-radius: 13px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.12s ease,
    box-shadow 0.15s ease;
}

.part-row:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.045);
}

.part-left {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.part-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: #f1f5f9;
  border: 1px solid #e1e7ef;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.part-svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.part-copy {
  min-width: 0;
}

.part-name {
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.25;
}

.part-meta {
  margin-top: 3px;
  font-size: 11.5px;
  color: #8a96a8;
  line-height: 1.25;
}

.part-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.part-price {
  font-size: 13px;
  font-weight: 850;
  color: #0f172a;
  white-space: nowrap;
}

.part-add {
  min-height: 26px;
  padding: 6px 9px;
  border-radius: 9px;
  background: #f8fafc;
  border: 1px solid #dfe5ee;
  color: #475569;
  font-size: 11px;
  font-weight: 800;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.part-row:hover .part-add {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}

/* ================================
   TRANSACTION ITEMS
================================ */

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-card {
  border: 1px solid #e1e7ef;
  border-radius: 14px;
  padding: 14px 16px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
}

.item-card:hover {
  border-color: #d4dce8;
}

.item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.item-title-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.item-type-badge {
  min-height: 23px;
  padding: 5px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 850;
  line-height: 1;
  flex-shrink: 0;
}

.badge-part {
  background: #eef4ff;
  color: #3366cc;
  border: 1px solid #dbe8ff;
}

.badge-service {
  background: #fff6e8;
  color: #c87518;
  border: 1px solid #ffe4c2;
}

.item-title {
  font-size: 13.5px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.25;
}

.item-sub {
  margin-top: 3px;
  font-size: 11.5px;
  color: #8a96a8;
}

.part-compact-layout,
.service-item-layout {
  margin-top: 4px;
}

.compact-inputs {
  display: grid;
  grid-template-columns: 88px 132px minmax(220px, 1fr) 132px;
  gap: 12px;
  align-items: end;
}

.service-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.service-grid .full {
  grid-column: 1 / -1;
}

.compact-total-card {
  min-height: 36px;
  padding: 8px 12px;
  border: 1px solid #e1e7ef;
  border-radius: 11px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
}

.compact-total-card span,
.line-total-bar span {
  font-size: 10px;
  font-weight: 850;
  color: #8a96a8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.compact-total-card strong,
.line-total-bar strong {
  margin-top: 2px;
  font-size: 13.5px;
  font-weight: 850;
  color: #0f172a;
}

.line-total-bar {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #e1e7ef;
  border-radius: 11px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

/* ================================
   PROFESSIONAL EMPTY / SETUP STATES
================================ */

.setup-panel {
  min-height: 132px;
  padding: 18px;
  border: 1px solid #dfe5ee;
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.9), rgba(255, 255, 255, 0.92));
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.items-empty-panel {
  min-height: 104px;
}

.warning-panel {
  background: #fffdf8;
  border-color: #f3dfba;
}

.setup-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #e1e7ef;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.warning-panel .setup-icon {
  background: #fff6e8;
  border-color: #ffe4c2;
  color: #c87518;
}

.setup-svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.setup-content {
  min-width: 0;
}

.setup-content strong {
  display: block;
  font-size: 13.5px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.25;
}

.setup-content p {
  max-width: 560px;
  margin: 5px 0 0;
  font-size: 12.5px;
  line-height: 1.48;
  color: #8a96a8;
}

.setup-content .btn {
  margin-top: 12px;
}

.setup-hints {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 13px;
}

.setup-hints span {
  min-height: 24px;
  padding: 5px 9px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #e1e7ef;
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
}

/* ================================
   SUMMARY
================================ */

.sticky-summary-card {
  min-height: 220px;
}

.summary-box {
  padding: 0;
  border: 1px solid #dfe5ee;
  border-radius: 14px;
  background: #f8fafc;
  overflow: hidden;
}

.summary-helper {
  padding: 11px 14px;
  border-bottom: 1px solid #e5eaf1;
  background: #ffffff;
  font-size: 12px;
  line-height: 1.4;
  color: #8a96a8;
}

.summary-box-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 14px;
  font-size: 13px;
  color: #526173;
  border-bottom: 1px solid #e5eaf1;
}

.summary-box-row strong {
  font-size: 13.5px;
  font-weight: 850;
  color: #0f172a;
}

.summary-discount-row {
  padding: 10px 14px 12px;
  border-bottom: 1px solid #e5eaf1;
}

.summary-discount-row label {
  display: block;
  margin-bottom: 6px;
  font-size: 11.5px;
  font-weight: 800;
  color: #64748b;
}

.summary-discount-row input {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #dfe5ee;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13px;
  outline: none;
}

.summary-discount-row input:focus {
  border-color: #94a3b8;
  box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.14);
}

.summary-box-total {
  background: #ffffff;
  border-bottom: none;
}

.summary-box-total span,
.summary-box-total strong {
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
}

.summary-actions {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 10px;
}

.summary-progress {
  padding: 12px 14px 10px;
  border-bottom: 1px solid #e5eaf1;
  background: #ffffff;
}

.summary-progress-title {
  margin-bottom: 9px;
  font-size: 11.5px;
  font-weight: 850;
  color: #0f172a;
}

.summary-check {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 0;
}

.summary-check span {
  width: 16px;
  height: 16px;
  border-radius: 999px;
  border: 1px solid #d5dde8;
  background: #f8fafc;
  flex-shrink: 0;
}

.summary-check p {
  margin: 0;
  font-size: 12px;
  color: #8a96a8;
  line-height: 1.3;
}

.summary-check.done span {
  background: #ecfdf3;
  border-color: #bbf7d0;
  position: relative;
}

.summary-check.done span::before {
  content: "✓";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #15803d;
  font-size: 10px;
  font-weight: 900;
}

.summary-check.done p {
  color: #475569;
  font-weight: 650;
}

.error-text {
  margin-top: 12px;
  color: #b42318;
  font-size: 12px;
  font-weight: 650;
}

/* ================================
   RESPONSIVE
================================ */

@media (max-width: 1050px) {
  .transaction-workspace {
    grid-template-columns: 1fr;
  }

  .transaction-side {
    position: static;
  }
}

@media (max-width: 900px) {
  .customer-vehicle-grid,
  .compact-inputs,
  .service-grid {
    grid-template-columns: 1fr;
  }

  .compact-total-card {
    align-items: flex-start;
  }

  .part-right {
    align-items: flex-end;
    flex-direction: column;
    gap: 6px;
  }
}

@media (max-width: 640px) {
  .summary-actions {
    grid-template-columns: 1fr;
  }

  .flow-steps {
    max-width: 100%;
    overflow-x: auto;
  }

  .flow-line {
    min-width: 28px;
  }

  .setup-panel {
    flex-direction: column;
  }

  .part-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .part-right {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .item-top,
  .item-title-group {
    flex-direction: column;
  }
}
</style>