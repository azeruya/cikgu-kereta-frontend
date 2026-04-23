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
        <div>
        <div class="page-title">
        {{ isEditMode ? "Edit Transaction" : "New Transaction" }}
        </div>
        <div class="page-date">
        {{ isEditMode ? "Update quotation or invoice items" : "Create quotation for customer vehicle service" }}
        </div>
        </div>

        <div class="top-right">
          <router-link to="/transactions" class="pill-btn link-btn">
            Back
          </router-link>
        </div>
      </div>

      <div class="create-grid">
        <Card>
          <template #header>
            <span class="card-title">Customer & Vehicle</span>
          </template>

          <div class="form-grid">
            <div class="field">
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

            <div class="field">
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

        <Card>
          <template #header>
            <span class="card-title">Available Compatible Parts</span>
            <span class="card-link">{{ compatibleParts.length }} items</span>
          </template>

          <div v-if="!form.vehicle_id" class="empty-box">
            Select a vehicle first to load compatible parts.
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
                  {{ part.sku || 'No SKU' }} · Stock: {{ part.stock }}
                  <span v-if="part.is_generic">· Generic</span>
                </div>
              </div>

              <div class="part-price">
                RM {{ formatMoney(part.selling_price) }}
              </div>
            </button>
          </div>
        </Card>
      </div>

      <Card>
        <template #header>
          <span class="card-title">Transaction Items</span>
          <button class="pill-btn" type="button" @click="addServiceItem">
            + Add Service
          </button>
        </template>

        <div v-if="form.items.length === 0" class="empty-box">
          No items added yet.
        </div>

        <div v-else class="items-list">
          <div
            v-for="(item, index) in form.items"
            :key="index"
            class="item-card"
          >
            <div class="item-top">
              <div class="item-title">
                {{ item.item_type === 'part' ? 'Part Item' : 'Service Item' }}
              </div>

              <button type="button" class="mini-btn" @click="removeItem(index)">
                Remove
              </button>
            </div>

            <div class="form-grid item-grid">
              <div class="field" v-if="item.item_type === 'part'">
                <label>Part</label>
                <input
                  type="text"
                  :value="item.part_label"
                  disabled
                />
              </div>

              <div class="field" v-if="item.item_type === 'service'">
                <label>Service name</label>
                <input
                  v-model="item.service_name"
                  type="text"
                  placeholder="e.g. Brake service"
                />
              </div>

              <div class="field">
                <label>Quantity</label>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="1"
                />
              </div>

              <div class="field">
                <label>Selling price</label>
                <input
                  v-model.number="item.selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>

              <div class="field full">
                <label>Note</label>
                <input
                  v-model="item.note"
                  type="text"
                  placeholder="Optional note"
                />
              </div>
            </div>

            <div class="item-total">
              Line total: RM {{ formatMoney(lineTotal(item)) }}
            </div>
          </div>
        </div>
      </Card>

      <div class="bottom-grid">
        <Card>
          <template #header>
            <span class="card-title">Notes</span>
          </template>

          <div class="field">
            <label>Transaction notes</label>
            <textarea
              v-model="form.notes"
              rows="4"
              placeholder="Optional remarks for quotation"
            ></textarea>
          </div>
        </Card>

        <Card>
          <template #header>
            <span class="card-title">Summary</span>
          </template>

          <div class="summary-list">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>RM {{ formatMoney(subtotal) }}</span>
            </div>

            <div class="field">
              <label>Discount amount</label>
              <input
                v-model.number="form.discount_amount"
                type="number"
                min="0"
                step="0.01"
              />
            </div>

            <div class="summary-row total">
              <span>Total</span>
              <span>RM {{ formatMoney(totalAfterDiscount) }}</span>
            </div>
          </div>

          <div class="action-row">
            <button class="pill-btn" type="button" @click="resetForm">
              Reset
            </button>

            <button
              class="pill-btn primary"
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
      collapsed: false,
      customers: [],
      vehicles: [],
      compatibleParts: [],
      selectedVehicle: null,
      loadingCustomers: false,
      loadingVehicles: false,
      loadingParts: false,
      saving: false,
      error: "",

      menu: [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Expenses", path: "/expenses", icon: "alert" },
        { name: "Reports", path: "/reports", icon: "chart" },
      ],

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
.create-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
  margin-top: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.item-grid {
  margin-top: 10px;
}

.vehicle-summary {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #ececea;
  border-radius: 10px;
  background: #fafaf9;
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: #555;
}

.parts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow: auto;
}

.part-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  text-align: left;
  background: #fafaf9;
  border: 1px solid #e8e8e6;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
}

.part-row:hover {
  background: #f3f3f1;
}

.part-name {
  font-size: 12px;
  font-weight: 500;
  color: #111;
}

.part-meta {
  font-size: 11px;
  color: #999;
  margin-top: 3px;
}

.part-price {
  font-size: 12px;
  font-weight: 600;
  color: #111;
  white-space: nowrap;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  border: 1px solid #ececea;
  border-radius: 10px;
  padding: 14px;
  background: #fafaf9;
}

.item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-title {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.mini-btn {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.item-total {
  margin-top: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #111;
  text-align: right;
}

.summary-list {
  display: grid;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #555;
}

.summary-row.total {
  padding-top: 10px;
  border-top: 1px solid #ececea;
  font-weight: 600;
  color: #111;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.link-btn {
  text-decoration: none;
}

.empty-box {
  font-size: 12px;
  color: #999;
  padding: 14px;
  border: 1px dashed #ddd;
  border-radius: 10px;
  background: #fafaf9;
}

.error-text {
  margin-top: 12px;
  font-size: 12px;
  color: #e53935;
}

@media (max-width: 1100px) {
  .create-grid,
  .bottom-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>