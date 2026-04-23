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
            <div class="page-title">Inventory</div>
            <span class="page-chip">
            {{
                activeTab === "all"
                ? `${filteredParts.length} item${filteredParts.length === 1 ? "" : "s"}`
                : activeTab === "low_stock"
                    ? `${filteredParts.length} low stock`
                    : `${filteredParts.length} ${activeTab}`
            }}
            </span>
        </div>

        <div class="page-date">
            Review parts, compatibility coverage, and stock movement
        </div>
        </div>

        <div class="top-right">
        <input
            class="search"
            v-model.trim="searchQuery"
            placeholder="Search part / SKU / variant..."
        />
        <button class="pill-btn" type="button">Export</button>
        <router-link to="/inventory/new" class="pill-btn primary link-btn">
            + Add Part
        </router-link>
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

      <div class="inventory-grid">
        <Card>
          <template #header>
            <span class="card-title">Parts List</span>
            <span class="card-link">{{ filteredParts.length }} item(s)</span>
          </template>

          <div v-if="loading" class="empty-state">Loading inventory...</div>

          <template v-else>
            <table class="table" v-if="filteredParts.length > 0">
              <thead>
                <tr>
                  <th>Part</th>
                  <th>SKU</th>
                  <th>Type</th>
                  <th>Stock</th>
                  <th>Sell Price</th>
                  <th>Compatibility</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="part in filteredParts"
                  :key="part.id"
                  class="clickable-row"
                  @click="openDetail(part)"
                >
                  <td>
                    <div class="item-name">
                      {{ part.name }}
                      <span v-if="part.variant">— {{ part.variant }}</span>
                    </div>
                    <small class="item-sub">{{ part.description || "-" }}</small>
                  </td>

                  <td>{{ part.sku || "-" }}</td>

                  <td>
                    <span
                      class="status-pill"
                      :class="part.is_generic ? 'sp-blue' : 'sp-amber'"
                    >
                      {{ part.is_generic ? "Generic" : "Specific" }}
                    </span>
                  </td>

                  <td>
                    <div :class="['stock-text', stockClass(part)]">
                      {{ part.stock }}
                    </div>
                    <small class="item-sub">Min {{ part.min_stock_threshold }}</small>
                  </td>

                  <td>RM {{ formatMoney(part.selling_price) }}</td>

                  <td>
                    <span v-if="part.is_generic">All vehicles</span>
                    <span v-else>
                      {{ compatibilityPreview(part) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-else class="empty-state">
              No parts found.
            </div>

            <div class="pagination" v-if="totalPages > 1 && activeTab !== 'low_stock'">
              <button @click="prevPage" :disabled="page === 1">←</button>
              <span>{{ page }} / {{ totalPages }}</span>
              <button @click="nextPage" :disabled="page === totalPages">→</button>
            </div>
          </template>
        </Card>

        <div class="stack-col">
          <Card>
            <template #header>
              <span class="card-title">Overview</span>
            </template>

            <div class="summary-stack">
              <div class="summary-line">
                <span>Total parts</span>
                <b>{{ parts.length }}</b>
              </div>
              <div class="summary-line">
                <span>Generic parts</span>
                <b>{{ genericCount }}</b>
              </div>
              <div class="summary-line">
                <span>Vehicle-specific parts</span>
                <b>{{ specificCount }}</b>
              </div>
              <div class="summary-line">
                <span>Low stock</span>
                <b>{{ lowStockCount }}</b>
              </div>
            </div>
          </Card>

          <Card>
            <template #header>
              <span class="card-title">Low Stock Alerts</span>
              <span class="card-link">Needs restock</span>
            </template>

            <div v-if="lowStockPreview.length === 0" class="empty-small">
              No low stock alerts.
            </div>

            <div v-else class="stock-preview-list">
              <div
                v-for="part in lowStockPreview"
                :key="part.id"
                class="stock-preview-item"
                @click="openDetail(part)"
              >
                <div>
                  <div class="item-name">
                    {{ part.name }}
                    <span v-if="part.variant">— {{ part.variant }}</span>
                  </div>
                  <small class="item-sub">Min {{ part.min_stock_threshold }}</small>
                </div>

                <div class="stock-preview-right">
                  <div :class="['stock-text', stockClass(part)]">
                    {{ part.stock }} left
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Teleport to ="body">
      <div class="modal" v-if="activePart && !showRestockModal" @click.self="closeDetail">
        <div v-if="detailLoading" class="modal-card large">
          <div class="empty-state">Loading part details...</div>
        </div>

        <div v-else class="modal-card large">
          <div class="modal-header">
            <span>{{ activePart.name }} <span v-if="activePart.variant">— {{ activePart.variant }}</span></span>
            <button class="mini-btn" @click="closeDetail">✕</button>
          </div>

          <div class="modal-body">
            <div class="part-detail-grid">
              <div><b>SKU:</b> {{ activePart.sku || "-" }}</div>
              <div><b>Type:</b> {{ activePart.is_generic ? "Generic" : "Specific" }}</div>
              <div><b>Cost Price:</b> RM {{ formatMoney(activePart.cost_price) }}</div>
              <div><b>Selling Price:</b> RM {{ formatMoney(activePart.selling_price) }}</div>
              <div><b>Stock:</b> {{ activePart.stock }}</div>
              <div><b>Min Threshold:</b> {{ activePart.min_stock_threshold }}</div>
              <div class="full"><b>Description:</b> {{ activePart.description || "-" }}</div>
            </div>

            <div class="jobs-section">
              <div class="section-title">Compatibility</div>

              <div v-if="activePart.is_generic" class="empty-small">
                This part is marked as generic and can be used across vehicles.
              </div>

              <div
                v-else-if="activePart.compatibilities && activePart.compatibilities.length > 0"
              >
                <div
                  v-for="compat in activePart.compatibilities"
                  :key="compat.id"
                  class="job-item"
                >
                  <div>
                    <div class="item-name">
                      {{ compat.make || "-" }} {{ compat.model || "" }}
                    </div>
                    <small>
                      Year:
                      {{
                        compat.year_from || compat.year_to
                          ? `${compat.year_from || "-"} to ${compat.year_to || "-"}`
                          : "All years"
                      }}
                    </small>
                  </div>
                </div>
              </div>

              <div v-else class="empty-small">
                No compatibility rows found.
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <router-link
            :to="`/inventory/${activePart.id}/edit`"
            class="pill-btn link-btn"
            >
            Edit
            </router-link>
            <button class="primary" @click="openRestockModal">Restock</button>
          </div>
        </div>
      </div>
        </Teleport>

        <Teleport to="body">
        <div v-if="showRestockModal" class="modal" style="z-index: 2000;" @click.self="closeRestockModal">
            <div class="modal-card">
            <div class="modal-header">
                <span>Restock {{ activePart?.name || "Part" }}</span>
                <button type="button" class="mini-btn" @click="closeRestockModal">✕</button>
            </div>

            <div class="modal-body">
                <div class="field">
                <label>Quantity to add</label>
                <input
                    v-model.number="restockForm.quantity"
                    type="number"
                    min="1"
                    step="1"
                />
                </div>

                <div v-if="activePart" style="margin-top: 10px; font-size: 12px; color: #666;">
                Current stock: <b>{{ activePart.stock }}</b>
                </div>

                <div v-if="restockError" class="page-error" style="margin-top: 12px;">
                {{ restockError }}
                    </div>
                </div>

                <div class="modal-actions">
                    <button type="button" @click="closeRestockModal">Cancel</button>
                    <button
                    type="button"
                    class="primary"
                    :disabled="restockLoading"
                    @click="submitRestock"
                    >
                    {{ restockLoading ? "Saving..." : "Confirm Restock" }}
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
        { label: "Generic", value: "generic" },
        { label: "Specific", value: "specific" },
        { label: "Low Stock", value: "low_stock" }
      ],

      activeTab: "all",
      searchQuery: "",
      parts: [],
      page: 1,
      totalPages: 1,
      activePart: null,
      showRestockModal: false,
      restockLoading: false,
      restockError: "",
      restockForm: {
        quantity: 1,
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

    filteredParts() {
      let list = this.parts || [];

      if (this.activeTab === "generic") {
        list = list.filter((p) => p.is_generic);
      } else if (this.activeTab === "specific") {
        list = list.filter((p) => !p.is_generic);
      } else if (this.activeTab === "low_stock") {
        list = list.filter((p) => Number(p.stock) <= Number(p.min_stock_threshold));
      }

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        list = list.filter((p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.variant || "").toLowerCase().includes(q) ||
          (p.sku || "").toLowerCase().includes(q)
        );
      }

      return list;
    },

    genericCount() {
      return this.parts.filter((p) => p.is_generic).length;
    },

    specificCount() {
      return this.parts.filter((p) => !p.is_generic).length;
    },

    lowStockCount() {
      return this.parts.filter((p) => Number(p.stock) <= Number(p.min_stock_threshold)).length;
    },

    lowStockPreview() {
      return this.parts
        .filter((p) => Number(p.stock) <= Number(p.min_stock_threshold))
        .slice(0, 5);
    }
  },

  mounted() {
    this.fetchParts();
  },

  methods: {
    getCacheKey(page = 1) {
      return `inventory-${this.activeTab}-page-${page}`;
    },

    async fetchParts(page = 1) {
      const cacheKey = this.getCacheKey(page);
      const cached = sessionStorage.getItem(cacheKey);

      this.error = "";

      if (cached) {
        const parsed = JSON.parse(cached);
        this.parts = parsed.data || [];
        this.page = parsed.current_page || 1;
        this.totalPages = parsed.last_page || 1;
      } else {
        this.loading = true;
      }

      try {
        let res;

        if (this.activeTab === "low_stock") {
          res = await api.get("/parts/low-stock");
          this.parts = res.data || [];
          this.page = 1;
          this.totalPages = 1;
        } else {
          res = await api.get(`/parts?page=${page}`);
          this.parts = res.data.data || [];
          this.page = res.data.current_page || 1;
          this.totalPages = res.data.last_page || 1;
          sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
        this.error =
          error.response?.data?.message || "Failed to load inventory.";
      } finally {
        this.loading = false;
      }
    },

    changeTab(tab) {
      this.activeTab = tab;
      this.page = 1;
      this.fetchParts(1);
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

    async openDetail(part) {
      this.activePart = {
        id: part.id,
        name: part.name,
        variant: part.variant,
        sku: part.sku,
        stock: part.stock,
        min_stock_threshold: part.min_stock_threshold
      };

      this.detailLoading = true;
      this.error = "";

      try {
        const res = await api.get(`/parts/${part.id}`);
        this.activePart = res.data;
      } catch (error) {
        console.error("Error loading part detail:", error);
        this.error =
          error.response?.data?.message || "Failed to load part detail.";
      } finally {
        this.detailLoading = false;
      }
    },

    closeDetail() {
      this.activePart = null;
      this.detailLoading = false;
    },

    nextPage() {
      if (this.page < this.totalPages) {
        this.fetchParts(this.page + 1);
      }
    },

    prevPage() {
      if (this.page > 1) {
        this.fetchParts(this.page - 1);
      }
    },

    formatMoney(value) {
      return Number(value || 0).toFixed(2);
    },

    compatibilityPreview(part) {
      if (!part.compatibilities || part.compatibilities.length === 0) {
        return "No compatibility";
      }

      const first = part.compatibilities[0];
      const label = `${first.make || "-"} ${first.model || ""}`.trim();

      if (part.compatibilities.length === 1) return label;
      return `${label} +${part.compatibilities.length - 1} more`;
    },

    stockClass(part) {
      return Number(part.stock) <= Number(part.min_stock_threshold)
        ? "stock-danger"
        : "stock-normal";
    },

    clearInventoryCache() {
    Object.keys(sessionStorage)
        .filter((key) => key.startsWith("inventory-"))
        .forEach((key) => sessionStorage.removeItem(key));
    },

    openRestockModal() {
    if (!this.activePart) return;

    this.restockError = "";
    this.restockForm = { quantity: 1 };
    this.showRestockModal = true;
    },

    closeRestockModal() {
    this.showRestockModal = false;
    this.restockLoading = false;
    this.restockError = "";
    this.restockForm = {
        quantity: 1,
    };
    },

    async submitRestock() {
    if (!this.activePart) return;

    this.restockLoading = true;
    this.restockError = "";
    this.error = "";

    try {
        const qty = Number(this.restockForm.quantity);

        if (!qty || qty < 1) {
        this.restockError = "Quantity must be at least 1.";
        this.restockLoading = false;
        return;
        }
        const res = await api.post(`/parts/${this.activePart.id}/restock`, {
        quantity: qty,
        });

        this.activePart = res.data.part || this.activePart;

        this.clearInventoryCache();

        await this.fetchParts(this.page);

        this.closeRestockModal();

        if (this.activePart?.id) {
        const refreshed = await api.get(`/parts/${this.activePart.id}`);
        this.activePart = refreshed.data;
        }
    } catch (error) {
        console.error("Error restocking part:", error);

        if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        this.restockError = Array.isArray(firstError)
            ? firstError[0]
            : "Validation failed.";
        } else {
        this.restockError =
            error.response?.data?.message || "Failed to restock part.";
        }
    } finally {
        this.restockLoading = false;
    }
    },
  }
};
</script>

<style scoped>
.inventory-grid {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 16px;
}

.stack-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-sub {
  color: #888;
}

.stock-text {
  font-weight: 600;
}

.stock-normal {
  color: #2e7d32;
}

.stock-danger {
  color: #e53935;
}

.stock-preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stock-preview-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #ececea;
  border-radius: 10px;
  background: #fafaf9;
  cursor: pointer;
}

.stock-preview-right {
  text-align: right;
  white-space: nowrap;
}

.part-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  font-size: 12px;
  color: #555;
}

.part-detail-grid .full {
  grid-column: 1 / -1;
}

@media (max-width: 1100px) {
  .inventory-grid,
  .part-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>