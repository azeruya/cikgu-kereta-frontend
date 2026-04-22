<template>
  <div class="dash">
    <Sidebar
      :collapsed="collapsed"
      :menu="menu"
      :user="currentUser"
      @toggle="collapsed = !collapsed"
    />

    <div class="main">
      <div class="top-bar">
        <div>
          <div class="page-title">
            {{ isEditMode ? "Edit Part" : "Add Part" }}
          </div>
          <div class="page-date">
            {{ isEditMode ? "Update inventory part details" : "Create a new inventory part" }}
          </div>
        </div>

        <div class="top-right">
          <router-link to="/inventory" class="pill-btn link-btn">
            Back
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="card">
        <div class="empty-state">Loading part data...</div>
      </div>

      <template v-else>
        <div class="part-form-grid">
          <Card>
            <template #header>
              <span class="card-title">Part Information</span>
            </template>

            <div class="form-grid">
              <div class="field">
                <label>Name</label>
                <input v-model="form.name" type="text" placeholder="e.g. Oil Filter" />
              </div>

              <div class="field">
                <label>Variant</label>
                <input v-model="form.variant" type="text" placeholder="e.g. Toyota Vios" />
              </div>

              <div class="field">
                <label>SKU</label>
                <input v-model="form.sku" type="text" placeholder="e.g. OF-TY-001" />
              </div>

              <div class="field">
                <label>Image URL</label>
                <input v-model="form.image" type="text" placeholder="Optional image URL" />
              </div>

              <div class="field full">
                <label>Description</label>
                <textarea
                  v-model="form.description"
                  rows="4"
                  placeholder="Optional description"
                ></textarea>
              </div>

              <div class="field">
                <label>Cost Price</label>
                <input v-model.number="form.cost_price" type="number" min="0" step="0.01" />
              </div>

              <div class="field">
                <label>Selling Price</label>
                <input v-model.number="form.selling_price" type="number" min="0" step="0.01" />
              </div>

              <div class="field">
                <label>Stock</label>
                <input v-model.number="form.stock" type="number" min="0" />
              </div>

              <div class="field">
                <label>Minimum Stock Threshold</label>
                <input v-model.number="form.min_stock_threshold" type="number" min="0" />
              </div>

              <div class="field full">
                <label class="checkbox-row">
                  <input v-model="form.is_generic" type="checkbox" />
                  <span>This is a generic part (usable across vehicles)</span>
                </label>
              </div>
            </div>
          </Card>

          <Card>
            <template #header>
              <span class="card-title">Summary</span>
            </template>

            <div class="summary-stack">
              <div class="summary-line">
                <span>Type</span>
                <b>{{ form.is_generic ? "Generic" : "Specific" }}</b>
              </div>
              <div class="summary-line">
                <span>Compatibility Rows</span>
                <b>{{ form.compatibilities.length }}</b>
              </div>
              <div class="summary-line">
                <span>Selling Price</span>
                <b>RM {{ formatMoney(form.selling_price) }}</b>
              </div>
              <div class="summary-line">
                <span>Current Stock</span>
                <b>{{ form.stock }}</b>
              </div>
            </div>

            <div class="action-stack">
              <button
                class="pill-btn primary full-btn"
                type="button"
                :disabled="saving || !canSubmit"
                @click="submitForm"
              >
                {{ saving ? "Saving..." : isEditMode ? "Update Part" : "Create Part" }}
              </button>
            </div>

            <div v-if="error" class="page-error">
              {{ error }}
            </div>
          </Card>
        </div>

        <Card v-if="!form.is_generic">
          <template #header>
            <span class="card-title">Compatibility</span>
            <button class="pill-btn" type="button" @click="addCompatibility">
              + Add Compatibility
            </button>
          </template>

          <div v-if="form.compatibilities.length === 0" class="empty-state">
            No compatibility rows yet. Add at least one for a specific part.
          </div>

          <div v-else class="compatibility-list">
            <div
              v-for="(compat, index) in form.compatibilities"
              :key="index"
              class="compatibility-card"
            >
              <div class="compatibility-top">
                <div class="item-name">Compatibility {{ index + 1 }}</div>
                <button class="mini-btn" type="button" @click="removeCompatibility(index)">
                  Remove
                </button>
              </div>

              <div class="form-grid">
                <div class="field">
                  <label>Make</label>
                  <input v-model="compat.make" type="text" placeholder="e.g. Toyota" />
                </div>

                <div class="field">
                  <label>Model</label>
                  <input v-model="compat.model" type="text" placeholder="e.g. Vios" />
                </div>

                <div class="field">
                  <label>Year From</label>
                  <input v-model.number="compat.year_from" type="number" min="1950" max="2100" />
                </div>

                <div class="field">
                  <label>Year To</label>
                  <input v-model.number="compat.year_to" type="number" min="1950" max="2100" />
                </div>
              </div>
            </div>
          </div>
        </Card>
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
      collapsed: false,
      loading: false,
      saving: false,
      error: "",

      menu: [
        { name: "Dashboard", path: "/dashboard", icon: "grid" },
        { name: "Transactions", path: "/transactions", icon: "list" },
        { name: "Customers", path: "/customers", icon: "user" },
        { name: "Inventory", path: "/inventory", icon: "box" },
        { name: "Expenses", path: "/expenses", icon: "alert" },
        { name: "Reports", path: "/reports", icon: "chart" }
      ],

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
    }
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
.part-form-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 16px;
  margin-bottom: 16px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-stack {
  margin-top: 14px;
}

.full-btn {
  width: 100%;
  justify-content: center;
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

@media (max-width: 1100px) {
  .part-form-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>