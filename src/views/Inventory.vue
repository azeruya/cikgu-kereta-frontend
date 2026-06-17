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

            <div class="page-subtitle">
                Review parts, compatibility coverage, and stock movement
            </div>
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
            <span class="card-title">Parts List</span>
            <span class="card-link">
              {{ totalRecords }} item(s)
            </span>
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

            <div class="modal-actions split">
              <div class="left-actions">
                <router-link
                  :to="`/inventory/${activePart.id}/edit`"
                  class="modal-action-btn"
                >
                  Edit
                </router-link>

                <button class="btn-primary" @click="openRestockModal">
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
                  class="confirm-cancel"
                  :disabled="restockLoading"
                  @click="closeRestockModal"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  class="confirm-primary"
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
      perPage: 5,
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

/* Inventory layout polish */
.item-name {
  font-size: 13px;
  font-weight: 700;
  color: #222;
}

.item-sub {
  font-size: 12px;
  color: #888;
}

.stock-pill {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.stock-pill.stock-normal {
  background: #eaf8ef;
  color: #287a3e;
}

.stock-pill.stock-danger {
  background: #fff1f0;
  color: #d92d20;
}

/* Modal style matching Customer page */
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

.info-list {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 8px 0;
}

.info-row:first-child {
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

.info-item.full {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 10px;
  font-weight: 700;
  color: #8a8a8a;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.info-value {
  font-size: 12px;
  font-weight: 600;
  color: #222;
  line-height: 1.25;
  word-break: break-word;
}

.info-value.stock-normal {
  color: #287a3e;
}

.info-value.stock-danger {
  color: #d92d20;
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

.detail-list-item small {
  font-size: 11.5px;
  color: #666;
}

.empty-small {
  font-size: 12px;
  color: #999;
  padding: 4px 0;
}

.modal-actions.split {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 42px 18px;
  border-top: 1px solid #eeeeee;
}

.left-actions {
  display: flex;
  gap: 8px;
}

.modal-actions button,
.modal-action-btn {
  height: 34px;
  min-width: 82px;
  padding: 0 12px;
  border-radius: 11px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.modal-actions button.primary {
  min-width: 92px;
  background: #111;
  color: #fff;
  border-color: #111;
}

/* Skeleton loading matching Customer modal */
.skeleton-line {
  height: 13px;
  border-radius: 999px;
  background: linear-gradient(90deg, #eee, #f7f7f7, #eee);
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

/* Stacked restock modal */
.stacked-modal {
  position: fixed;
  inset: 0;
  z-index: 5000;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(1.5px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.confirm-card {
  width: min(360px, calc(100vw - 32px));
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
}

.confirm-title {
  font-size: 16px;
  font-weight: 700;
  color: #171717;
  margin-bottom: 8px;
}

.confirm-message {
  font-size: 12.5px;
  line-height: 1.5;
  color: #777;
  margin-bottom: 16px;
}

.confirm-message.left {
  text-align: left;
}

/* min stock */
.stock-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stock-main {
  font-size: 12.8px;
  font-weight: 700;
  color: #287a3e;
  white-space: nowrap;
}

.stock-main.stock-danger {
  color: #d92d20;
}

.stock-main.stock-normal {
  color: #287a3e;
}

.stock-min {
  font-size: 11px;
  color: #999;
}


/* low stock */
.stock-preview-right {
  text-align: right;
  white-space: nowrap;
}

.stock-preview-right .stock-danger {
  font-size: 13px;
  font-weight: 800;
  color: #d92d20;
}

.stock-preview-right small {
  font-size: 11px;
  color: #999;
}

/* low stock meter */
.stock-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 13px;
  border: 1px solid #ececea;
  border-radius: 13px;
  background: #fff;
  cursor: pointer;
  margin-bottom: 5px;
}

.stock-preview-item:hover {
  background: #fafafa;
}

.stock-alert-main {
  flex: 1;
  min-width: 0;
}

.stock-alert-main .item-name{
  font-size: 12px;
}

.stock-meter {
  height: 3px;
  margin-top: 7px;
  border-radius: 999px;
  background: #eeeeee;
  overflow: hidden;
}

.stock-meter-fill {
  height: 100%;
  border-radius: 999px;
  background: #f06b6b; /* softer red */
}

.stock-danger-text {
  font-size: 12px;
  font-weight: 600;
  color: #d24b4b;
}

.restock-link {
  margin-top: 3px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #999;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}

.restock-link:hover {
  color: #d24b4b;
}

@media (max-width: 1100px) {
  .inventory-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .info-row,
  .skeleton-grid {
    grid-template-columns: 1fr;
  }

  .modal-header,
  .modal-body,
  .modal-actions.split {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>