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
            {{ isEditMode ? "Update inventory part details" : "Create a new inventory part" }}
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
        <div class="form-page-grid">
          <Card>
            <template #header>
              <span class="card-title">Part Information</span>
            </template>

            <div class="form-grid">
              <div class="form-field">
                  <label>Name</label>
                  <input v-model="form.name" type="text" placeholder="e.g. Oil Filter" />
                </div>

                <div class="form-field">
                  <label>Variant</label>
                  <input v-model="form.variant" type="text" placeholder="e.g. Regional" />
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
                    rows="4"
                    placeholder="Optional description"
                  ></textarea>
                </div>

                <div class="form-field">
                  <label>Cost Price</label>
                  <input v-model.number="form.cost_price" type="number" min="0" step="0.01" />
                </div>

                <div class="form-field">
                  <label>Selling Price</label>
                  <input v-model.number="form.selling_price" type="number" min="0" step="0.01" />
                </div>

                <div class="form-field">
                  <label>Stock</label>
                  <input v-model.number="form.stock" type="number" min="0" />
                </div>

                <div class="form-field">
                  <label>Minimum Stock Threshold</label>
                  <input v-model.number="form.min_stock_threshold" type="number" min="0" />
                </div>

                <div class="form-field full">
                  <label class="toggle-card">
                    <div class="toggle-content">
                      <input v-model="form.is_generic" type="checkbox" />
                      <div>
                        <div class="toggle-title">Generic part</div>
                        <div class="toggle-subtitle">
                          Usable across all vehicles. Compatibility rows are not required.
                        </div>
                      </div>
                    </div>

                    <span class="toggle-badge">
                      {{ form.is_generic ? "Generic" : "Specific" }}
                    </span>
                  </label>
                </div>
            </div>

            <div v-if="error" class="page-error" style="margin-top:12px;">
              {{ error }}
            </div>
          </Card>
        </div>

        <div class="compatibility-wrapper">
          <Card v-if="!form.is_generic">
          <template #header>
            <span class="card-title">Compatibility</span>
            <button class="btn btn-secondary btn-pill" type="button" @click="addCompatibility">
              + Add Compatibility
            </button>
          </template>

          <div v-if="form.compatibilities.length === 0" class="compat-empty">
            <div class="compat-empty-title">No compatibility added yet</div>
            <div class="compat-empty-sub">
              Add make, model, and year range for vehicle-specific parts.
            </div>
            <button class="btn btn-secondary btn-pill" type="button" @click="addCompatibility">
              + Add Compatibility
            </button>
          </div>

          <div v-else class="compatibility-list">
            <div
              v-for="(compat, index) in form.compatibilities"
              :key="index"
              class="compatibility-card"
            >
              <div class="compatibility-top">
                <div class="item-name">Compatibility {{ index + 1 }}</div>
                <button class="btn btn-sm btn-ghost" type="button" @click="removeCompatibility(index)">
                  Remove
                </button>
              </div>

              <div class="form-grid">
                <div class="form-field">
                  <label>Make</label>
                  <input v-model="compat.make" type="text" placeholder="e.g. Toyota" />
                </div>

                <div class="form-field">
                  <label>Model</label>
                  <input v-model="compat.model" type="text" placeholder="e.g. Vios" />
                </div>

                <div class="form-field">
                  <label>Year From</label>
                  <input v-model.number="compat.year_from" type="number" min="1950" max="2100" />
                </div>

                <div class="form-field">
                  <label>Year To</label>
                  <input v-model.number="compat.year_to" type="number" min="1950" max="2100" />
                </div>
              </div>
            </div>
          </div>
        </Card>
        </div>

        <div class="page-bottom-actions form-actions">
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
          is_generic: this.form.is_generic,
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
.form-page-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  width: 100%;
  max-width: 1180px;
}

.compatibility-wrapper {
  width: 100%;
  max-width: 1180px;
  margin-top: 18px;
}

.compatibility-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compatibility-card {
  border: 1px solid #ececea;
  border-radius: 10px;
  padding: 14px;
  background: #fafaf9;
}

.compatibility-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.compat-empty {
  min-height: 105px;
  border: 1px dashed #dddddd;
  border-radius: 14px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
}

.compat-empty-title {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}

.compat-empty-sub {
  font-size: 12px;
  color: #888;
}

@media (max-width: 640px) {
  .toggle-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>