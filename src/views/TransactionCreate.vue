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

      <div class="transaction-workspace">
        <div class="transaction-main">
          <div class="create-grid">
            <Card>
              <template #header>
                <span class="card-title">Customer & Vehicle</span>
              </template>

              <div class="form-grid">
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
                  <select v-model="form.vehicle_id" @change="handleVehicleChange" :disabled="!form.customer_id">
                    <option value="">Select vehicle</option>
                    <option
                      v-for="vehicle in vehicles"
                      :key="vehicle.id"
                      :value="vehicle.id"
                    >
                      {{ vehicle.license_plate }} — {{ vehicle.make }} {{ vehicle.model }} ({{ vehicle.year }})
                    </option>
                  </select>
                </div>
              </div>

              <div v-if="selectedVehicle" class="vehicle-summary">
                <div><b>Plate:</b> {{ selectedVehicle.license_plate }}</div>
                <div><b>Make / Model:</b> {{ selectedVehicle.make }} {{ selectedVehicle.model }}</div>
                <div><b>Year:</b> {{ selectedVehicle.year }}</div>
              </div>
            </Card>

            <Card class="compatible-parts-card">
              <template #header>
                <span class="card-title">Available Compatible Parts</span>
                <span class="card-link">{{ compatibleParts.length }} items</span>
              </template>

              <div class="compatible-parts-body">
                <div
                  v-if="!form.vehicle_id"
                  class="empty-state-panel empty-state-centered"
                >
                  <div class="empty-state-icon">□</div>
                  <div class="empty-state-text">
                    <strong>Select a vehicle first</strong>
                    <p>Compatible parts will appear based on vehicle make, model, and year.</p>
                  </div>
                </div>

                <div
                  v-else-if="compatibleParts.length === 0"
                  class="empty-state-panel empty-state-centered"
                >
                  <div class="empty-state-icon">!</div>
                  <div class="empty-state-text">
                    <strong>No compatible parts found</strong>
                    <p>You can still add a service manually using the button below.</p>
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
                    <div>
                      <div class="part-name">
                        {{ part.name }}
                        <span v-if="part.variant">— {{ part.variant }}</span>
                      </div>

                      <div class="part-meta">
                        {{ part.sku || "-" }} · Stock: {{ part.stock }} ·
                        {{ part.is_generic ? "Generic" : "Specific" }}
                      </div>
                    </div>

                    <div class="part-price">
                      RM {{ formatMoney(part.selling_price) }}
                    </div>
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <template #header>
              <span class="card-title">Transaction Items</span>
              <button class="btn btn-secondary btn-pill" type="button" @click="addServiceItem">
                + Add Service
              </button>
            </template>

            <div v-if="form.items.length === 0" class="empty-state-panel empty-state-inline">
              <div class="empty-state-icon">+</div>

              <div class="empty-state-text">
                <strong>No items added yet</strong>
                <p>Add a compatible part from the list above or click “Add Service” to begin.</p>
              </div>
            </div>

            <div v-else class="items-list">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="item-card"
                :class="item.item_type === 'part' ? 'part-card compact-item-card' : 'service-card'"
              >
                <div class="item-top clean-item-top">
                  <div>
                    <div class="item-title">
                      {{ item.item_type === "part" ? item.part_label : (item.service_name || "Unnamed service") }}
                    </div>
                    <div class="item-sub">
                      {{ item.item_type === "part" ? "Part" : "Service" }}
                    </div>
                  </div>

                  <button type="button" class="btn btn-sm btn-ghost" @click="removeItem(index)">
                    Remove
                  </button>
                </div>

                <!-- PART UI: compact -->
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

                    <div class="form-field compact-note">
                      <label>Note</label>
                      <input
                        v-model="item.note"
                        type="text"
                        placeholder="Optional note"
                      />
                    </div>

                    <div class="compact-total">
                      <span>Total</span>
                      <strong>RM {{ formatMoney(lineTotal(item)) }}</strong>
                    </div>
                  </div>
                </div>

                <!-- SERVICE UI: descriptive -->
                <div v-else class="service-item-layout">
                  <div class="form-grid item-grid">
                    <div class="form-field full">
                      <label>Service name</label>
                      <input
                        v-model="item.service_name"
                        type="text"
                        placeholder="e.g. Brake service, inspection, labour charge"
                      />
                    </div>

                    <div class="form-field">
                      <label>Duration (hrs)</label>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="0.1"
                        step="0.1"
                        placeholder="e.g. 1.5"
                      />
                    </div>

                    <div class="form-field">
                      <label>Rate (RM/hr)</label>
                      <input
                        v-model.number="item.selling_price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 80"
                      />
                    </div>

                    <div class="form-field full">
                      <label>Note</label>
                      <input
                        v-model="item.note"
                        type="text"
                        placeholder="Optional service note"
                      />
                    </div>
                  </div>

                  <div class="item-total">
                    <span>Line total</span>
                    <strong>RM {{ formatMoney(lineTotal(item)) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
          <template #header>
            <span class="card-title">Notes</span>
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

        <div class="transaction-side">
        <Card class="sticky-summary-card">
          <template #header>
            <span class="card-title">Summary</span>
          </template>

          <div class="summary-box">
            <div v-if="items.length === 0" class="summary-helper">
              Add items to calculate the quotation total.
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
            <button type="button" class="btn btn-secondary btn-pill" @click="resetForm">
              Reset
            </button>

            <button
              class="btn btn-primary btn-pill"
              type="button"
              :disabled="saving || !canSubmit"
              @click="submitTransaction"
            >
              {{ saving ? "Saving..." : (isEditMode ? "Update Transaction" : "Save Quotation") }}
            </button>
          </div>

          <p v-if="error" class="error-text">{{ error }}</p>
        </Card>
        </div>

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
.transaction-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
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
  top: 24px;
  align-self: start;
}

.create-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* compatible parts */
.compatible-parts-card {
  min-height: 265px;
}

.compatible-parts-body {
  max-height: 265px;
  min-height: 165px;
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

/* part list */
.parts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.part-row {
  width: 100%;
  min-height: 58px;
  padding: 11px 13px;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
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
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
}

.part-name {
  font-size: 13px;
  font-weight: 750;
  color: #0f172a;
}

.part-meta {
  margin-top: 3px;
  font-size: 11.5px;
  color: #8a96a8;
}

.part-price {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  white-space: nowrap;
}

/* selected items */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-card {
  border: 1px solid #e1e7ef;
  border-radius: 13px;
  padding: 14px 16px;
  background: #ffffff;
}

.item-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.item-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}

.item-sub {
  margin-top: 3px;
  font-size: 11.5px;
  color: #8a96a8;
}

.compact-inputs {
  display: grid;
  grid-template-columns: 90px 140px minmax(220px, 1fr) 120px;
  gap: 12px;
  align-items: end;
}

.compact-total {
  min-height: 38px;
  padding-left: 14px;
  border-left: 1px solid #e5eaf1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
}

.compact-total span {
  font-size: 10px;
  font-weight: 750;
  color: #8a96a8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.compact-total strong {
  margin-top: 3px;
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
}

/* vehicle summary */
.vehicle-summary {
  margin-top: 14px;
  padding: 13px 14px;
  border: 1px solid #e1e7ef;
  border-radius: 12px;
  background: #f8fafc;
  display: grid;
  gap: 6px;
  font-size: 12.5px;
  color: #526173;
}

.vehicle-summary strong {
  color: #0f172a;
}

/* empty states */
.empty-state-panel {
  border: 1px dashed #d9e1ea;
  border-radius: 12px;
  background: #fbfcfe;
  color: #8a96a8;
}

.empty-state-centered {
  min-height: 148px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 11px;
  text-align: center;
}

.empty-state-inline {
  min-height: 72px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  text-align: left;
}

.empty-state-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #eef2f7;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 800;
}

.empty-state-text strong {
  display: block;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.25;
}

.empty-state-text p {
  max-width: 390px;
  margin: 4px 0 0;
  font-size: 12.5px;
  line-height: 1.45;
  color: #8a96a8;
}

/* summary */
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
  font-weight: 750;
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

/* stepper */
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

/* responsive */
@media (max-width: 1200px) {
  .transaction-workspace {
    grid-template-columns: 1fr;
  }

  .transaction-side {
    position: static;
  }
}

@media (max-width: 900px) {
  .create-grid {
    grid-template-columns: 1fr;
  }

  .compact-inputs {
    grid-template-columns: 1fr 1fr;
  }

  .compact-total {
    grid-column: 1 / -1;
    border-left: none;
    border-top: 1px solid #e5eaf1;
    padding-left: 0;
    padding-top: 12px;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .compact-inputs {
    grid-template-columns: 1fr;
  }

  .summary-actions {
    grid-template-columns: 1fr;
  }

  .flow-steps {
    max-width: 100%;
    overflow-x: auto;
  }
}
</style>