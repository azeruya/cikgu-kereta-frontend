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
                <div class="page-title">Inventory</div>
                <span class="page-chip">
                {{
                  activeTab === "all"
                    ? `${totalRecords} item${totalRecords === 1 ? "" : "s"}`
                    : activeTab === "low_stock"
                        ? `${filteredParts.length} low stock`
                        : `${filteredParts.length} ${activeTab}`
                }}
              </span>
            </div>

            <!-- 
            <div class="page-subtitle">
                Review parts, compatibility coverage, and stock movement
            </div>
            -->
          </div>

          <div class="page-actions">
            <input
                class="search-input"
                v-model.trim="searchQuery"
                placeholder="Search part / SKU / variant..."
            />
            <button
              class="btn btn-secondary btn-pill"
              type="button"
              :disabled="exporting"
              @click="exportInventory"
            >
              {{ exporting ? "Exporting..." : "Export" }}
            </button>
            <router-link to="/inventory/new" class="btn btn-primary btn-pill link-btn">
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
            <div class="section-heading no-index">
              <div>
                <span class="card-title">Items</span>
                <p class="section-caption">
                  Click a row to view details, edit, or restock.
                </p>
              </div>
            </div>

            <span class="section-count">
              Showing {{ filteredParts.length }} of {{ totalRecords }}
            </span>
          </template>

          <div v-if="loading" class="empty-state">Loading inventory...</div>

          <template v-else>
            <table class="table inventory-table" v-if="filteredParts.length > 0">
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
                      class="badge"
                      :class="part.is_generic ? 'badge-generic' : 'badge-specific'"
                    >
                      {{ part.is_generic ? "Generic" : "Specific" }}
                    </span>
                  </td>

                  <td>
                    <div class="stock-block">
                      <span :class="['stock-main', stockClass(part)]">
                        {{ part.stock }} left
                      </span>
                      <span class="stock-min">
                        Min {{ part.min_stock_threshold }}
                      </span>
                    </div>
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

            <div class="summary-list">
              <div class="summary-row">
                <span>Total parts</span>
                <b>{{ parts.length }}</b>
              </div>
              <div class="summary-row">
                <span>Generic parts</span>
                <b>{{ genericCount }}</b>
              </div>
              <div class="summary-row">
                <span>Vehicle-specific parts</span>
                <b>{{ specificCount }}</b>
              </div>
              <div class="summary-row">
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

            <div
              v-for="part in lowStockPreview"
              :key="part.id"
              class="stock-preview-item"
              @click="openDetail(part)"
            >
              <div class="stock-alert-main">
                <div class="item-name">
                  {{ part.name }}
                  <span v-if="part.variant">— {{ part.variant }}</span>
                </div>

                <small class="item-sub">
                  {{ part.stock }} / {{ part.min_stock_threshold }} minimum
                </small>

                <div class="stock-meter">
                  <div
                    class="stock-meter-fill"
                    :style="{ width: stockMeterWidth(part) + '%' }"
                  ></div>
                </div>
              </div>

              <div class="stock-preview-right">
                <div class="stock-danger-text">
                  {{ Number(part.min_stock_threshold) - Number(part.stock) }} short
                </div>
                <button class="restock-link" @click.stop="openRestockFromList(part)">
                  Restock
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- PART DETAIL MODAL -->
      <Teleport to="body">
        <div
          class="modal"
          v-if="activePart && !showRestockModal"
          @click.self="closeDetail"
        >
          <div v-if="detailLoading" class="modal-card large">
            <div class="modal-header">
              <span>Part Details</span>
              <button class="btn btn-sm btn-ghost" @click="closeDetail">✕</button>
            </div>

            <div class="modal-body modal-detail-body">
              <div class="detail-section">
                <div class="skeleton-line title"></div>
                <div class="skeleton-grid">
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line"></div>
                  <div class="skeleton-line"></div>
                </div>
              </div>

              <div class="detail-section">
                <div class="skeleton-line wide"></div>
                <div class="skeleton-line wide"></div>
              </div>
            </div>
          </div>

          <div v-else class="modal-card large">
            <div class="modal-header">
              <span>
                {{ activePart.name }}
                <span v-if="activePart.variant">— {{ activePart.variant }}</span>
              </span>
              <button class="btn btn-sm btn-ghost" @click="closeDetail">✕</button>
            </div>

            <div class="modal-body modal-detail-body">
              <div class="detail-section">
                <div class="section-title">Part Information</div>

                <div class="info-list">
                  <div class="info-row">
                    <div class="info-item">
                      <span class="info-label">SKU</span>
                      <span class="info-value">{{ activePart.sku || "-" }}</span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Type</span>
                      <span class="info-value">
                        {{ activePart.is_generic ? "Generic" : "Vehicle Specific" }}
                      </span>
                    </div>
                  </div>

                  <div class="info-row">
                    <div class="info-item">
                      <span class="info-label">Cost Price</span>
                      <span class="info-value">
                        RM {{ formatMoney(activePart.cost_price) }}
                      </span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Selling Price</span>
                      <span class="info-value">
                        RM {{ formatMoney(activePart.selling_price) }}
                      </span>
                    </div>
                  </div>

                  <div class="info-row">
                    <div class="info-item">
                      <span class="info-label">Stock</span>
                      <span :class="['info-value', stockClass(activePart)]">
                        {{ activePart.stock }} left
                      </span>
                    </div>

                    <div class="info-item">
                      <span class="info-label">Minimum Stock</span>
                      <span class="info-value">
                        {{ activePart.min_stock_threshold }}
                      </span>
                    </div>
                  </div>

                  <div class="info-row last">
                    <div class="info-item full">
                      <span class="info-label">Description</span>
                      <span class="info-value">
                        {{ activePart.description || "-" }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <div class="section-title">Compatibility</div>

                <div v-if="activePart.is_generic" class="empty-small">
                  This part is generic and can be used for all vehicles.
                </div>

                <div
                  v-else-if="activePart.compatibilities && activePart.compatibilities.length > 0"
                >
                  <div
                    v-for="compat in activePart.compatibilities"
                    :key="compat.id"
                    class="detail-list-item"
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

            <div class="modal-footer split">
              <div class="left-actions">
                <router-link
                  :to="`/inventory/${activePart.id}/edit`"
                  class="btn btn-secondary btn-pill"
                >
                  Edit
                </router-link>

                <button class="btn btn-primary btn-pill" @click="openRestockModal">
                  Restock
                </button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- RESTOCK MODAL -->
        <Teleport to="body">
          <div
            v-if="showRestockModal"
            class="stacked-modal"
            @click.self="closeRestockModal"
          >
            <div class="confirm-card restock-card">
              <div class="confirm-title">
                Restock part
              </div>

              <div class="confirm-message left">
                Add stock for <strong>{{ activePart?.name || "this part" }}</strong>.
              </div>

              <div class="form-field">
                <label>Quantity to add</label>
                <input
                  v-model.number="restockForm.quantity"
                  type="number"
                  min="1"
                  step="1"
                />
              </div>

              <div v-if="activePart" class="summary-highlight">
                Current stock: <strong>{{ activePart.stock }}</strong>
              </div>

              <div v-if="restockError" class="page-error" style="margin-top: 12px;">
                {{ restockError }}
              </div>

              <div class="confirm-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-pill"
                  :disabled="restockLoading"
                  @click="closeRestockModal"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  class="btn btn-primary btn-pill"
                  :disabled="restockLoading"
                  @click="submitRestock"
                >
                  {{ restockLoading ? "Saving..." : "Confirm" }}
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
      collapsed: localStorage.getItem("sidebar-collapsed") === "true",
      loading: false,
      detailLoading: false,
      error: "",

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
      perPage: 10,
      totalRecords: 0,
      activePart: null,
      exporting: false,
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
  const search = this.searchQuery || "none";
  return `inventory-${this.activeTab}-search-${search}-page-${page}-per-${this.perPage}`;
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
    this.totalRecords = parsed.total || 0;
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
      this.totalRecords = this.parts.length;
    } else {
      res = await api.get("/parts", {
        params: {
          page,
          per_page: this.perPage,
          search: this.searchQuery || undefined,
        },
      });

      this.parts = res.data.data || [];
      this.page = res.data.current_page || 1;
      this.totalPages = res.data.last_page || 1;
      this.totalRecords = res.data.total || 0;

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

    async exportInventory() {
      this.exporting = true;
      this.error = "";

      try {
        const params = {
          search: this.searchQuery || undefined,
          type: this.activeTab || "all",
        };

        const response = await api.get("/parts/export/csv", {
          params,
          responseType: "blob",
        });

        const blob = new Blob([response.data], {
          type: "text/csv;charset=utf-8;",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.setAttribute("download", `inventory-${new Date().toISOString().slice(0, 10)}.csv`);

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Error exporting inventory:", error);
        this.error =
          error.response?.data?.message || "Failed to export inventory.";
      } finally {
        this.exporting = false;
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

    prevPage() {
  if (this.page > 1) {
    this.fetchParts(this.page - 1);
  }
},

nextPage() {
  if (this.page < this.totalPages) {
    this.fetchParts(this.page + 1);
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

    stockMeterWidth(part) {
      const stock = Number(part.stock || 0);
      const min = Number(part.min_stock_threshold || 1);

      return Math.max(0, Math.min(100, (stock / min) * 100));
    },

    openRestockFromList(part) {
      this.activePart = part;
      this.showRestockModal = true;
      this.restockForm.quantity = 1;
      this.restockError = "";
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
/* ================================
   INVENTORY PAGE
================================ */

.inventory-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) 340px;
  gap: 18px;
  align-items: start;
}

.stack-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ================================
   INVENTORY TABLE
================================ */

.inventory-table tbody tr {
  cursor: pointer;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease;
}

.inventory-table tbody tr:hover {
  background: #f8fafc;
}

.inventory-table td {
  vertical-align: middle;
}

.item-name {
  font-size: 13px;
  font-weight: 780;
  color: #0f172a;
  line-height: 1.25;
}

.item-sub {
  display: block;
  margin-top: 3px;
  font-size: 11.8px;
  color: #8a96a8;
  line-height: 1.3;
}

/* ================================
   STOCK
================================ */

.stock-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stock-main {
  font-size: 12.7px;
  font-weight: 800;
  white-space: nowrap;
}

.stock-main.stock-danger,
.stock-danger {
  color: #d92d20;
}

.stock-main.stock-normal,
.stock-normal {
  color: #15803d;
}

.stock-min {
  font-size: 11px;
  color: #8a96a8;
}

/* ================================
   LOW STOCK PREVIEW
================================ */

.stock-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 13px;
  border: 1px solid #e1e7ef;
  border-radius: 14px;
  background: #ffffff;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.stock-preview-item + .stock-preview-item {
  margin-top: 8px;
}

.stock-preview-item:hover {
  background: #f8fafc;
  border-color: #d4dce8;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
}

.stock-alert-main {
  flex: 1;
  min-width: 0;
}

.stock-alert-main .item-name {
  font-size: 12.8px;
  font-weight: 800;
}

.stock-preview-right {
  text-align: right;
  white-space: nowrap;
}

.stock-danger-text {
  font-size: 12px;
  font-weight: 800;
  color: #d92d20;
}

.restock-link {
  margin-top: 4px;
  min-height: 24px;
  padding: 4px 8px;
  border: 1px solid #e1e7ef;
  border-radius: 999px;
  background: #ffffff;
  color: #64748b;
  font-size: 11px;
  font-weight: 750;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.restock-link:hover {
  background: #fff1f0;
  border-color: #ffd6d2;
  color: #d92d20;
}

/* ================================
   STOCK METER
================================ */

.stock-meter {
  width: 100%;
  height: 5px;
  margin-top: 8px;
  border-radius: 999px;
  background: #edf1f6;
  overflow: hidden;
}

.stock-meter-fill {
  height: 100%;
  border-radius: inherit;
  background: #f59e0b;
}

/* ================================
   MODAL SKELETON
================================ */

.skeleton-line {
  height: 13px;
  border-radius: 999px;
  background: linear-gradient(90deg, #eef2f7, #f8fafc, #eef2f7);
  background-size: 200% 100%;
  animation: skeleton 1.2s infinite;
}

.skeleton-line.title {
  width: 180px;
  height: 18px;
  margin-bottom: 16px;
}

.skeleton-line.wide {
  width: 100%;
  margin-top: 10px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}

@keyframes skeleton {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* ================================
   RESPONSIVE
================================ */

@media (max-width: 1100px) {
  .inventory-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .skeleton-grid {
    grid-template-columns: 1fr;
  }
}
</style>