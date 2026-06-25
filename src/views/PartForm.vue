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
            {{ isEditMode ? "Edit Part" : "Add Part" }}
          </div>
          <div class="page-subtitle">
            {{
              isEditMode
                ? "Update inventory part details, pricing, stock, and compatibility"
                : "Create a new inventory part for workshop transactions"
            }}
          </div>
        </div>

        <div class="page-actions">
          <router-link to="/inventory" class="btn btn-secondary btn-pill link-btn">
            Back
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="card">
        <div class="empty-state">Loading part data...</div>
      </div>

      <template v-else>
        <div class="part-form-layout">
          <div class="part-form-main">
            <!-- PART SETUP -->
            <Card class="workflow-card part-setup-card">
              <template #header>
                <div class="section-heading no-index">
                  <div>
                    <span class="card-title">Part Setup</span>
                    <p class="section-caption">
                      Configure how this item should appear in inventory and quotations.
                    </p>
                  </div>
                </div>
              </template>

              <!-- TYPE SELECTOR -->
              <div class="part-type-panel">
                <div class="part-type-copy">
                  <div class="part-type-label">Part type</div>
                  <div class="part-type-title">
                    {{ form.is_generic ? "Generic part" : "Vehicle-specific part" }}
                  </div>
                  <p>
                    {{
                      form.is_generic
                        ? "This part can be used for any vehicle and does not require compatibility rules."
                        : "This part will only appear for vehicles that match its compatibility rules."
                    }}
                  </p>
                </div>

                <label class="type-switch">
                  <input v-model="form.is_generic" type="checkbox" />
                  <span class="type-switch-track">
                    <span class="type-switch-thumb"></span>
                  </span>
                  <span class="type-switch-text">
                    {{ form.is_generic ? "Generic" : "Specific" }}
                  </span>
                </label>
              </div>

              <!-- BASIC INFO -->
              <div class="form-block">
                <div class="block-head">
                  <div>
                    <div class="block-title">Basic Information</div>
                    <p class="block-caption">
                      Name, SKU, and description used across inventory and transaction items.
                    </p>
                  </div>
                </div>

                <div class="form-grid">
                  <div class="form-field">
                    <label>Name <span class="required">*</span></label>
                    <input v-model="form.name" type="text" placeholder="e.g. Oil Filter" />
                  </div>

                  <div class="form-field">
                    <label>Variant</label>
                    <input v-model="form.variant" type="text" placeholder="e.g. Regional, China, OEM" />
                  </div>

                  <div class="form-field">
                    <label>SKU</label>
                    <input v-model="form.sku" type="text" placeholder="e.g. OF-TY-001" />
                  </div>

                  <div class="form-field">
                    <label>Image URL</label>
                    <input v-model="form.image" type="text" placeholder="Optional image URL" />
                  </div>

                  <div class="form-field full">
                    <label>Description</label>
                    <textarea
                      v-model="form.description"
                      rows="3"
                      placeholder="Optional description or internal notes about this part"
                    ></textarea>
                  </div>
                </div>
              </div>

              <!-- PRICING STOCK -->
              <div class="form-block">
                <div class="block-head">
                  <div>
                    <div class="block-title">Pricing & Stock</div>
                    <p class="block-caption">
                      Set selling price, current stock, and low-stock threshold.
                    </p>
                  </div>
                </div>

                <div class="form-grid">
                  <div class="form-field">
                    <label>Cost Price</label>
                    <input
                      v-model.number="form.cost_price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div class="form-field">
                    <label>Selling Price <span class="required">*</span></label>
                    <input
                      v-model.number="form.selling_price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>

                  <div class="form-field">
                    <label>Stock <span class="required">*</span></label>
                    <input
                      v-model.number="form.stock"
                      type="number"
                      min="0"
                      placeholder="0"
                    />
                  </div>

                  <div class="form-field">
                    <label>Minimum Stock Threshold</label>
                    <input
                      v-model.number="form.min_stock_threshold"
                      type="number"
                      min="0"
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
              </div>

              <div v-if="error" class="page-error">
                {{ error }}
              </div>
            </Card>

            <!-- COMPATIBILITY -->
            <Card v-if="!form.is_generic" class="workflow-card">
              <template #header>
                <div class="section-heading no-index">
                  <div>
                    <span class="card-title">Compatibility</span>
                    <p class="section-caption">
                      Define which vehicles can use this specific part.
                    </p>
                  </div>
                </div>

                <button
                  class="btn btn-secondary btn-pill"
                  type="button"
                  @click="addCompatibility"
                >
                  + Add Compatibility
                </button>
              </template>

              <div v-if="form.compatibilities.length === 0" class="setup-panel setup-panel-sm">
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
                  <strong>No compatibility added</strong>
                  <p>
                    Add make, model, and year range so this part only appears for matching vehicles.
                  </p>

                  <button
                    class="btn btn-secondary btn-sm"
                    type="button"
                    @click="addCompatibility"
                  >
                    + Add Compatibility
                  </button>
                </div>
              </div>

              <div v-else class="compatibility-list">
                <div
                  v-for="(compat, index) in form.compatibilities"
                  :key="index"
                  class="compatibility-card"
                >
                  <div class="compatibility-top">
                    <div class="compatibility-title-group">
                      <span class="type-badge info">Rule {{ index + 1 }}</span>
                      <div>
                        <div class="item-name">Vehicle compatibility</div>
                        <div class="item-sub">
                          Match by make, model, and production year.
                        </div>
                      </div>
                    </div>

                    <button
                      class="item-remove-btn"
                      type="button"
                      @click="removeCompatibility(index)"
                    >
                      Remove
                    </button>
                  </div>

                  <div class="compatibility-grid">
                    <div class="form-field form-field-sm">
                      <label>Make <span class="required">*</span></label>
                      <input v-model="compat.make" type="text" placeholder="e.g. Toyota" />
                    </div>

                    <div class="form-field form-field-sm">
                      <label>Model <span class="required">*</span></label>
                      <input v-model="compat.model" type="text" placeholder="e.g. Vios" />
                    </div>

                    <div class="form-field form-field-sm">
                      <label>Year From</label>
                      <input
                        v-model.number="compat.year_from"
                        type="number"
                        min="1950"
                        max="2100"
                        placeholder="2010"
                      />
                    </div>

                    <div class="form-field form-field-sm">
                      <label>Year To</label>
                      <input
                        v-model.number="compat.year_to"
                        type="number"
                        min="1950"
                        max="2100"
                        placeholder="2015"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <!-- SIDE SUMMARY -->
          <aside class="part-form-side">
            <Card class="save-card">
              <template #header>
                <span class="card-title">Inventory Preview</span>
              </template>

              <div v-if="!canSubmit" class="summary-progress">
                <div class="summary-progress-title">Ready to save</div>

                <div class="summary-check" :class="{ done: form.name }">
                  <span></span>
                  <p>Part name added</p>
                </div>

                <div class="summary-check" :class="{ done: Number(form.selling_price) > 0 }">
                  <span></span>
                  <p>Selling price added</p>
                </div>

                <div
                  v-if="!form.is_generic"
                  class="summary-check"
                  :class="{ done: form.compatibilities.length > 0 }"
                >
                  <span></span>
                  <p>Compatibility added</p>
                </div>
              </div>

              <div class="side-summary-box">
                <div class="side-summary-row">
                  <span>Type</span>
                  <strong>{{ form.is_generic ? "Generic" : "Specific" }}</strong>
                </div>

                <div class="side-summary-row">
                  <span>Stock</span>
                  <strong>{{ form.stock || 0 }}</strong>
                </div>

                <div class="side-summary-row">
                  <span>Selling Price</span>
                  <strong>RM {{ Number(form.selling_price || 0).toFixed(2) }}</strong>
                </div>

                <div class="side-summary-row">
                  <span>Margin</span>
                  <strong>
                    RM {{ Number((form.selling_price || 0) - (form.cost_price || 0)).toFixed(2) }}
                  </strong>
                </div>

                <div v-if="!form.is_generic" class="side-summary-row">
                  <span>Compatibility</span>
                  <strong>{{ form.compatibilities.length }} rule(s)</strong>
                </div>
              </div>

              <div class="side-actions">
                <router-link to="/inventory" class="btn btn-secondary btn-pill link-btn">
                  Cancel
                </router-link>

                <button
                  class="btn btn-primary btn-pill"
                  type="button"
                  :disabled="saving || !canSubmit"
                  @click="submitForm"
                >
                  {{ saving ? "Saving..." : isEditMode ? "Update Part" : "Create Part" }}
                </button>
              </div>
            </Card>
          </aside>
        </div>
      </template>
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
    Card
  },

  data() {
    return {
      collapsed: localStorage.getItem("sidebar-collapsed") === "true",
      loading: false,
      saving: false,
      error: "",

      form: {
        name: "",
        variant: "",
        sku: "",
        description: "",
        cost_price: 0,
        selling_price: 0,
        stock: 0,
        min_stock_threshold: 0,
        image: "",
        is_generic: false,
        compatibilities: []
      }
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

    isEditMode() {
      return Boolean(this.$route.params.id);
    },

    partId() {
      return this.$route.params.id;
    },

    canSubmit() {
      if (!this.form.name) return false;
      if (Number(this.form.cost_price) < 0) return false;
      if (Number(this.form.selling_price) < 0) return false;
      if (Number(this.form.stock) < 0) return false;
      if (Number(this.form.min_stock_threshold) < 0) return false;

      if (!this.form.is_generic) {
        return this.form.compatibilities.length > 0;
      }

      return true;
    }
  },

  mounted() {
    if (this.isEditMode) {
      this.fetchPart();
    }
  },

  methods: {
    async fetchPart() {
      this.loading = true;
      this.error = "";

      try {
        const res = await api.get(`/parts/${this.partId}`);
        const part = res.data;

        this.form = {
          name: part.name || "",
          variant: part.variant || "",
          sku: part.sku || "",
          description: part.description || "",
          cost_price: Number(part.cost_price || 0),
          selling_price: Number(part.selling_price || 0),
          stock: Number(part.stock || 0),
          min_stock_threshold: Number(part.min_stock_threshold || 0),
          image: part.image || "",
          is_generic: Boolean(part.is_generic),
          compatibilities: (part.compatibilities || []).map((c) => ({
            make: c.make || "",
            model: c.model || "",
            year_from: c.year_from ?? null,
            year_to: c.year_to ?? null
          }))
        };
      } catch (error) {
        console.error("Error loading part:", error);
        this.error = error.response?.data?.message || "Failed to load part.";
      } finally {
        this.loading = false;
      }
    },

    addCompatibility() {
      this.form.compatibilities.push({
        make: "",
        model: "",
        year_from: null,
        year_to: null
      });
    },

    removeCompatibility(index) {
      this.form.compatibilities.splice(index, 1);
    },

    async submitForm() {
      this.saving = true;
      this.error = "";

      try {
        const payload = {
          name: this.form.name,
          variant: this.form.variant || null,
          sku: this.form.sku || null,
          description: this.form.description || null,
          cost_price: Number(this.form.cost_price || 0),
          selling_price: Number(this.form.selling_price || 0),
          stock: Number(this.form.stock || 0),
          min_stock_threshold: Number(this.form.min_stock_threshold || 0),
          image: this.form.image || null,
          is_generic: Boolean(this.form.is_generic),
          compatibilities: this.form.is_generic
            ? []
            : this.form.compatibilities.map((c) => ({
                make: c.make || null,
                model: c.model || null,
                year_from: c.year_from || null,
                year_to: c.year_to || null
              }))
        };

        if (this.isEditMode) {
          await api.put(`/parts/${this.partId}`, payload);
        } else {
          await api.post("/parts", payload);
        }

        this.$router.push("/inventory");
      } catch (error) {
        console.error("Error saving part:", error);
        this.error =
          error.response?.data?.message || "Failed to save part.";
      } finally {
        this.saving = false;
      }
    },

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
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
  },

  watch: {
    "form.is_generic"(value) {
      if (value) {
        this.form.compatibilities = [];
      }
    }
  }
};
</script>

<style scoped>
/* ================================
   PART FORM
================================ */

.part-form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 22px;
  align-items: start;
  width: 100%;
  max-width: 1180px;
}

.part-form-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.part-form-side {
  position: sticky;
  top: 24px;
  align-self: start;
}

.part-setup-card {
  overflow: hidden;
}

.item-remove-btn {
  flex-shrink: 0;

  min-width: 74px;
  height: 34px;
  padding: 0 12px;

  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff7f7;
  color: #dc2626;

  font-size: 11.5px;
  font-weight: 750;
  line-height: 1;
  cursor: pointer;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  box-shadow: none;

  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.12s ease;
}

.item-remove-btn:hover {
  background: #fff1f0;
  border-color: #fca5a5;
  color: #b91c1c;
}

.item-remove-btn:active {
  transform: scale(0.97);
}

/* ================================
   TYPE PANEL
================================ */

.part-type-panel {
  margin-bottom: 18px;
  padding: 15px 16px;
  border: 1px solid #dfe5ee;
  border-radius: 14px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.92), rgba(255, 255, 255, 0.96));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.part-type-copy {
  min-width: 0;
}

.part-type-label {
  margin-bottom: 4px;
  font-size: 10.5px;
  font-weight: 850;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: #64748b;
}

.part-type-title {
  font-size: 13.8px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.25;
}

.part-type-copy p {
  max-width: 620px;
  margin: 4px 0 0;
  font-size: 12.5px;
  color: #8a96a8;
  line-height: 1.45;
}

/* ================================
   TYPE SWITCH
================================ */

.type-switch {
  height: 38px;
  padding: 5px 10px 5px 5px;
  border: 1px solid #dfe5ee;
  border-radius: 999px;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  cursor: pointer;
  flex-shrink: 0;
}

.type-switch input {
  display: none;
}

.type-switch-track {
  width: 48px;
  height: 28px;
  padding: 3px;
  border-radius: 999px;
  background: #e9eef5;
  border: 1px solid #d7deea;
  display: flex;
  align-items: center;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.type-switch-thumb {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.18);
  transition: transform 0.15s ease;
}

.type-switch input:checked + .type-switch-track {
  background: #0f172a;
  border-color: #0f172a;
}

.type-switch input:checked + .type-switch-track .type-switch-thumb {
  transform: translateX(20px);
}

.type-switch-text {
  min-width: 52px;
  font-size: 12px;
  font-weight: 800;
  color: #475569;
}

/* ================================
   FORM BLOCKS
================================ */

.form-block {
  padding-top: 17px;
  margin-top: 17px;
  border-top: 1px solid #edf1f6;
}

.form-block:first-of-type {
  padding-top: 0;
  margin-top: 0;
  border-top: none;
}

.block-head {
  margin-bottom: 12px;
}

.block-title {
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
}

.block-caption {
  margin: 3px 0 0;
  font-size: 11.8px;
  color: #8a96a8;
  line-height: 1.35;
}

.required {
  color: #b42318;
  font-weight: 850;
}

/* ================================
   COMPATIBILITY
================================ */

.compatibility-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compatibility-card {
  border: 1px solid #e1e7ef;
  border-radius: 14px;
  padding: 14px 16px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
}

.compatibility-card:hover {
  border-color: #d4dce8;
}

.compatibility-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 13px;
}

.compatibility-title-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.compatibility-grid {
  display: grid;
  grid-template-columns: 1.1fr 1.1fr 0.7fr 0.7fr;
  gap: 12px;
  align-items: end;
}

.setup-panel-sm {
  min-height: 96px;
  padding: 14px 16px;
}

.setup-panel-sm .setup-icon {
  width: 34px;
  height: 34px;
  border-radius: 11px;
}

.setup-panel-sm .setup-svg {
  width: 16px;
  height: 16px;
}

.setup-panel-sm .setup-content strong {
  font-size: 13px;
}

.setup-panel-sm .setup-content p {
  font-size: 12.2px;
  line-height: 1.42;
}

.setup-panel-sm .btn {
  margin-top: 10px;
}

/* ================================
   SIDE CARD
================================ */

.save-card {
  min-height: auto;
}

/* ================================
   RESPONSIVE
================================ */

@media (max-width: 1050px) {
  .part-form-layout {
    grid-template-columns: 1fr;
  }

  .part-form-side {
    position: static;
  }
}

@media (max-width: 900px) {
  .compatibility-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .part-type-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .compatibility-top,
  .compatibility-title-group {
    flex-direction: column;
  }

  .compatibility-grid {
    grid-template-columns: 1fr;
  }
}
</style>