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
              <!--
              <div>
                <span class="card-title">Items</span>
                <p class="section-caption">
                  Click a row to view details, edit, or restock.
                </p>
              </div>
                -->
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

            <div v-if="lowStockPreview.length === 0" class="mini-empty-state">
              <strong>No low stock alerts</strong>
              <p>All parts are currently above their minimum stock threshold.</p>
            </div>

            <div
              v-for="part in lowStockPreview"
              v-else
              :key="part.id"
              class="stock-alert-card compact"
              @click="openDetail(part)"
            >
              <div class="stock-alert-info">
                <div class="stock-alert-name">{{ part.name }}</div>
                <div class="stock-alert-meta">
                  {{ part.stock }} in stock · Minimum {{ part.min_stock_threshold }}
                </div>
              </div>

              <button
                type="button"
                class="stock-alert-quick-btn"
                @click.stop="openRestockFromList(part)"
              >
                Restock
              </button>
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
          <div class="modal-header detail-modal-header">
            <div>
              <div class="detail-modal-title-row">
                <span>
                  {{ activePart.name }}
                  <span v-if="activePart.variant">— {{ activePart.variant }}</span>
                </span>

                <span
                  class="type-badge"
                  :class="activePart.is_generic ? 'info' : 'warning'"
                >
                  {{ activePart.is_generic ? "Generic" : "Specific" }}
                </span>
              </div>

              <p class="detail-modal-subtitle">
                Inventory details, stock level, pricing, and compatibility.
              </p>
            </div>

            <button class="btn btn-sm btn-ghost" @click="closeDetail">✕</button>
          </div>

          <div class="modal-body modal-detail-body">
            <div class="part-kpi-grid">
              <div class="part-kpi-card">
                <span>Stock</span>
                <strong :class="stockClass(activePart)">
                  {{ activePart.stock }} left
                </strong>
              </div>

              <div class="part-kpi-card">
                <span>Selling Price</span>
                <strong>RM {{ formatMoney(activePart.selling_price) }}</strong>
              </div>

              <div class="part-kpi-card">
                <span>Margin</span>
                <strong>
                  RM {{ formatMoney((activePart.selling_price || 0) - (activePart.cost_price || 0)) }}
                </strong>
              </div>
            </div>

            <div class="detail-section-card -card">
              <div class="detail-section-title">Part Details</div>

              <div class="compact-detail-list">
                <div class="compact-detail-row">
                  <span>SKU</span>
                  <strong>{{ activePart.sku || "-" }}</strong>
                </div>

                <div class="compact-detail-row">
                  <span>Cost Price</span>
                  <strong>RM {{ formatMoney(activePart.cost_price) }}</strong>
                </div>

                <div class="compact-detail-row">
                  <span>Minimum Stock</span>
                  <strong>{{ activePart.min_stock_threshold }}</strong>
                </div>
              </div>
            </div>

            <div class="detail-section-card">
              <div class="detail-section-title">Description</div>
              <p class="detail-description">
                {{ activePart.description || "No description provided." }}
              </p>
            </div>

            <div v-if="activePart.image" class="detail-section-card">
  <div class="detail-section-title">Image</div>

  <div class="part-image-block">
    <img
      :src="activePart.image"
      :alt="activePart.name"
      class="part-detail-image"
      @error="handleImageError"
    />

    <a
      :href="activePart.image"
      target="_blank"
      rel="noopener noreferrer"
      class="part-image-link"
    >
      Open image in new tab
    </a>
  </div>
</div>

            <div class="detail-section-card">
              <div class="detail-section-title">Compatibility</div>

              <div v-if="activePart.is_generic" class="setup-panel compact">
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
                  <strong>Compatible with all vehicles</strong>
                  <p>This generic part can be selected for any customer vehicle.</p>
                </div>
              </div>

              <div
                v-else-if="activePart.compatibilities && activePart.compatibilities.length > 0"
                class="detail-card-list"
              >
                <div
                  v-for="compat in activePart.compatibilities"
                  :key="compat.id"
                  class="detail-list-card"
                >
                  <div class="detail-list-title">
                    {{ compat.make || "-" }} {{ compat.model || "" }}
                  </div>

                  <div class="detail-list-meta">
                    Year:
                    {{
                      compat.year_from || compat.year_to
                        ? `${compat.year_from || "-"} to ${compat.year_to || "-"}`
                        : "All years"
                    }}
                  </div>
                </div>
              </div>

              <div v-else class="setup-panel compact">
                <div class="setup-icon">
                  <svg viewBox="0 0 24 24" class="setup-svg">
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                    <path d="M10.3 4.3L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z" />
                  </svg>
                </div>

                <div class="setup-content">
                  <strong>No compatibility found</strong>
                  <p>This specific part does not have any vehicle compatibility rule yet.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer detail-action-footer">
            <div class="detail-action-left">
              <router-link
                :to="`/inventory/${activePart.id}/edit`"
                class="btn btn-secondary btn-pill"
              >
                Edit
              </router-link>

              <button
                type="button"
                class="btn btn-primary btn-pill"
                @click="openRestockModal"
              >
                Restock
              </button>
            </div>

            <button
              type="button"
              class="btn btn-danger-light btn-pill"
              @click="openDeleteModal(activePart)"
            >
              Delete
            </button>
          </div>
        </div>
        </div>
      </Teleport>

      <!-- RESTOCK MODAL -->
        <Teleport to="body">
          <div
            v-if="showRestockModal"
            class="modal"
            @click.self="closeRestockModal"
          >
            <div class="modal-card action-modal-card">
              <div class="action-modal-header">
                <div>
                  <div class="action-modal-title">Restock part</div>
                  <p class="action-modal-subtitle">
                    Add stock quantity for
                    <strong>{{ activePart?.name || "this part" }}</strong>.
                  </p>
                </div>

                <button
                  class="btn btn-sm btn-ghost"
                  type="button"
                  @click="closeRestockModal"
                >
                  ✕
                </button>
              </div>

              <div class="action-modal-body">
                <div v-if="activePart" class="action-summary-box">
                  <div class="action-summary-row">
                    <span>Current stock</span>
                    <strong>{{ activePart.stock }}</strong>
                  </div>

                  <div class="action-summary-row">
                    <span>Minimum stock</span>
                    <strong>{{ activePart.min_stock_threshold }}</strong>
                  </div>
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

                <div v-if="restockError" class="page-error" style="margin-top: 12px;">
                  {{ restockError }}
                </div>
              </div>

              <div class="action-modal-footer">
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

      <!-- Delete Confirmation Modal -->
      <Teleport to="body">
        <div
          v-if="showDeleteModal"
          class="modal"
          @click.self="closeDeleteModal"
        >
          <div class="modal-card danger-confirm-card">
            <div class="danger-confirm-body">
              <div class="danger-confirm-icon">!</div>

              <div class="danger-confirm-title">
                Delete part?
              </div>

              <div class="danger-confirm-message">
                Are you sure you want to delete
                <strong>
                  {{ partToDelete?.name || "this part" }}
                  <span v-if="partToDelete?.variant">
                    — {{ partToDelete.variant }}
                  </span>
                </strong>?
                This action cannot be undone.
              </div>

              <div
                v-if="deleteError"
                class="page-error"
                style="margin-top: 14px;"
              >
                {{ deleteError }}
              </div>
            </div>

            <div class="danger-confirm-footer">
              <button
                type="button"
                class="btn btn-secondary btn-pill"
                :disabled="deleteLoading"
                @click="closeDeleteModal"
              >
                Cancel
              </button>

              <button
                type="button"
                class="btn btn-danger btn-pill"
                :disabled="deleteLoading"
                @click="confirmDeletePart"
              >
                {{ deleteLoading ? "Deleting..." : "Delete" }}
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
      showDeleteModal: false,
      deleteLoading: false,
      deleteError: "",
      partToDelete: null,
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

    handleImageError(event) {
      event.target.style.display = "none";
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

    openDeleteModal(part) {
      this.partToDelete = part;
      this.deleteError = "";
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      if (this.deleteLoading) return;

      this.showDeleteModal = false;
      this.partToDelete = null;
      this.deleteError = "";
    },

    async confirmDeletePart() {
      if (!this.partToDelete) return;

      this.deleteLoading = true;
      this.deleteError = "";
      this.error = "";

      try {
        await api.delete(`/parts/${this.partToDelete.id}`);

        this.clearInventoryCache();

        this.showDeleteModal = false;
        this.partToDelete = null;
        this.activePart = null;

        const nextPage =
          this.parts.length === 1 && this.page > 1
            ? this.page - 1
            : this.page;

        await this.fetchParts(nextPage);
      } catch (error) {
        console.error("Failed to delete part:", error);

        this.deleteError =
          error.response?.data?.message ||
          "Failed to delete part.";
      } finally {
        this.deleteLoading = false;
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
  font-weight: 720;
  white-space: nowrap;
}

.stock-main.stock-normal,
.stock-normal {
  color: #334155;
  font-weight: 720;
}

.stock-main.stock-danger,
.stock-danger {
  color: #dc2626;
  font-weight: 820;
}

.stock-min {
  margin-top: 2px;
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
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

/* low stock alert */
.stock-alert-card.compact {
  min-height: 58px;
  padding: 11px 13px;
  border: 1px solid #e1e7ef;
  border-radius: 14px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.stock-alert-card.compact:hover {
  background: #fbfcfe;
  border-color: #d4dce8;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.035);
}

.stock-alert-info {
  min-width: 0;
}

.stock-alert-name {
  font-size: 12.6px;
  font-weight: 820;
  color: #0f172a;
  line-height: 1.25;
}

.stock-alert-meta {
  margin-top: 3px;
  font-size: 11.3px;
  font-weight: 520;
  color: #8a96a8;
  line-height: 1.3;
}

.stock-alert-quick-btn {
  min-height: 28px;
  padding: 0 12px;
  border: 1px solid #dfe5ee;
  border-radius: 999px;
  background: #ffffff;
  color: #334155;
  font-size: 11.2px;
  font-weight: 850;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.12s ease;
}

.stock-alert-quick-btn:hover {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
  transform: translateY(-1px);
}

.mini-empty-state {
  padding: 13px 14px;
  border: 1px dashed #dfe5ee;
  border-radius: 14px;
  background: #fbfcfe;
}

.mini-empty-state strong {
  display: block;
  font-size: 12.8px;
  font-weight: 800;
  color: #0f172a;
}

.mini-empty-state p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #8a96a8;
  line-height: 1.35;
}

.part-image-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.part-detail-image {
  width: 100%;
  max-height: 220px;
  object-fit: contain;
  border: 1px solid #dfe5ee;
  border-radius: 12px;
  background: #f8fafc;
}

.part-image-link {
  width: fit-content;
  font-size: 13px;
  font-weight: 600;
  color: #344b68;
  text-decoration: none;
}

.part-image-link:hover {
  text-decoration: underline;
}
</style>