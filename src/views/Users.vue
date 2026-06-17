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
            <div class="page-title">Users</div>
            <span class="page-chip">{{ filteredUsers.length }} users</span>
          </div>
          <!--
          <div class="page-subtitle">Manage staff and admin accounts for this branch</div>
           -->
          
        </div>

        <div class="page-actions">
          <input
            v-model.trim="search"
            class="search-input"
            type="text"
            placeholder="Search user..."
          />

          <button class="btn btn-primary btn-pill" @click="openModal()">+ Add User</button>
        </div>
      </div>

      <Card>
        <template #header>
          <span class="card-title">User List</span>
        </template>

        <div v-if="loading" class="empty-state">Loading users...</div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          No users found.
        </div>

        <table v-else class="table users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>
                <div class="user-cell">
                  <div class="user-avatar" :class="user.role === 'admin' ? 'avatar-admin' : 'avatar-staff'">
                    {{ getInitials(user.name) }}
                  </div>

                  <div class="user-main">
                    <div class="user-name">
                      {{ user.name }}
                      <span v-if="user.id === currentUser?.id" class="badge badge-self">You</span>
                    </div>
                    <div class="user-sub">
                      {{ user.role === "admin" ? "Administrator account" : "Staff account" }}
                    </div>
                  </div>
                </div>
              </td>

              <td>
                <div class="email-text">{{ user.email }}</div>
              </td>

              <td>
                <span class="badge" :class="user.role === 'admin' ? 'badge-admin' : 'badge-staff'">
                  {{ formatRole(user.role) }}
                </span>
              </td>

              <td>
                <span class="muted-date">{{ formatDate(user.created_at) }}</span>
              </td>

              <td class="right">
                <div class="icon-btn-group" @click.stop>
                 
                    <button
                      class="icon-btn"
                      title="Edit user"
                      @click="openModal(user)"
                    >
                      <svg viewBox="0 0 24 24" class="icon-svg">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                      </svg>
                    </button>

                    <button
                      class="icon-btn icon-btn-danger"
                      title="Delete user"
                      :disabled="user.id === currentUser?.id"
                      @click="openDeleteModal(user)"
                    >
                      <svg viewBox="0 0 24 24" class="icon-svg">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 15H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
      
                </div>
                </td>
                
          
            </tr>
          </tbody>
        </table>
      </Card>

      <!-- ADD/EDIT USER FORM MODAL -->
      <Teleport to="body">
        <div v-if="showModal" class="modal" @click.self="closeModal">
          <div class="modal-card large form-modal-card">
            <div class="modal-header">
              <span>{{ editingUserId ? "Edit User" : "Add User" }}</span>
              <button type="button" class="btn btn-sm btn-ghost" @click="closeModal">✕</button>
            </div>

            <div class="modal-body form-modal-body">
              <div class="form-section">
                <div class="section-title">User Information</div>

                <div class="form-grid">
                  <div class="form-field">
                    <label>Name</label>
                    <input v-model="form.name" type="text" placeholder="Full name" />
                  </div>

                  <div class="form-field">
                    <label>Email</label>
                    <input v-model="form.email" type="email" placeholder="Email address" />
                  </div>

                  <div class="form-field">
                    <label>Role</label>
                    <select v-model="form.role">
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div class="form-field">
                    <label>{{ editingUserId ? "New Password" : "Password" }}</label>
                    <input
                      v-model="form.password"
                      type="password"
                      :placeholder="editingUserId ? 'Leave blank to keep current' : 'Password'"
                    />
                  </div>
                </div>
              </div>

              <div v-if="formError" class="page-error" style="margin-top:12px;">
                {{ formError }}
              </div>
            </div>

            <div class="modal-footer form-actions">
              <button type="button" class="btn btn-secondary btn-pill" @click="closeModal">Cancel</button>
              <button
                type="button"
                class="btn btn-primary btn-pill"
                :disabled="saving"
                @click="saveUser"
              >
                {{ saving ? "Saving..." : (editingUserId ? "Update" : "Create") }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- DELETE CONFIRMATION MODAL -->
      <Teleport to="body">
        <div
          v-if="showDeleteModal"
          class="modal-overlay"
          @click.self="closeDeleteModal"
        >
          <div class="confirm-card">
            <div class="confirm-icon confirm-icon-danger">!</div>

            <div class="confirm-title">Delete user?</div>

            <div class="confirm-message">
              Are you sure you want to delete
              <strong>{{ userToDelete?.name }}</strong>?
              This action cannot be undone.
            </div>

            <div class="confirm-actions">
              <button
                type="button"
                class="btn btn-secondary btn-pill"
                :disabled="deletingUser"
                @click="closeDeleteModal"
              >
                Cancel
              </button>

              <button
                type="button"
                class="btn btn-danger btn-pill"
                :disabled="deletingUser"
                @click="confirmDeleteUser"
              >
                {{ deletingUser ? "Deleting..." : "Delete" }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <div v-if="error" class="page-error">{{ error }}</div>
    </div>
  </div>
</template>

<script>
import Sidebar from "../components/Sidebar.vue";
import Card from "../components/Card.vue";
import api from "../services/api";

export default {
  name: "Users",
  components: { Sidebar, Card },

  data() {
    return {
      collapsed: localStorage.getItem("sidebar-collapsed") === "true",
      loading: false,
      saving: false,
      error: "",
      formError: "",
      users: [],
      showModal: false,
      editingUserId: null,
      showDeleteModal: false,
      userToDelete: null,
      deletingUser: false,
      search: "",
      form: {
        name: "",
        email: "",
        role: "staff",
        password: "",
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

    filteredUsers() {
      const q = this.search.toLowerCase().trim();

      if (!q) return this.users;

      return this.users.filter((user) => {
        return (
          user.name?.toLowerCase().includes(q) ||
          user.email?.toLowerCase().includes(q) ||
          user.role?.toLowerCase().includes(q)
        );
      });
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
  },

  mounted() {
    this.fetchUsers();
  },

  methods: {
    async fetchUsers() {
      const cacheKey = this.getUsersCacheKey();
      const cached = sessionStorage.getItem(cacheKey);

      this.error = "";

      if (cached) {
        this.users = JSON.parse(cached) || [];
        this.loading = false;
      } else {
        this.loading = true;
      }

      try {
        const res = await api.get("/users");

        this.users = res.data || [];
        sessionStorage.setItem(cacheKey, JSON.stringify(this.users));
      } catch (error) {
        this.error = error.response?.data?.message || "Failed to load users.";
      } finally {
        this.loading = false;
      }
    },

    openModal(user = null) {
      this.formError = "";

      if (user) {
        this.editingUserId = user.id;
        this.form = {
          name: user.name,
          email: user.email,
          role: user.role,
          password: "",
        };
      } else {
        this.editingUserId = null;
        this.form = {
          name: "",
          email: "",
          role: "staff",
          password: "",
        };
      }

      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.editingUserId = null;
      this.formError = "";
    },

    async saveUser() {
      this.saving = true;
      this.formError = "";

      try {
        const payload = {
          name: this.form.name,
          email: this.form.email,
          role: this.form.role,
        };

        if (this.form.password) {
          payload.password = this.form.password;
        }

        if (this.editingUserId) {
          await api.put(`/users/${this.editingUserId}`, payload);
        } else {
          await api.post("/users", payload);
        }

        this.closeModal();
        this.clearUsersCache();
        await this.fetchUsers();
      } catch (error) {
        console.error("Failed to save user:", error);

        if (error.response?.data?.errors) {
          const firstError = Object.values(error.response.data.errors)[0];
          this.formError = Array.isArray(firstError)
            ? firstError[0]
            : "Validation failed.";
        } else {
          this.formError =
            error.response?.data?.message || "Failed to save user.";
        }
      } finally {
        this.saving = false;
      }
    },

    async deleteUser(user) {
      if (!confirm(`Delete ${user.name}?`)) return;

      try {
        await api.delete(`/users/${user.id}`);
        await this.fetchUsers();
      } catch (error) {
        this.error = error.response?.data?.message || "Failed to delete user.";
      }
    },

    openDeleteModal(user) {
      if (user.id === this.currentUser?.id) return;

      this.userToDelete = user;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      if (this.deletingUser) return;

      this.showDeleteModal = false;
      this.userToDelete = null;
    },

    async confirmDeleteUser() {
      if (!this.userToDelete) return;

      this.deletingUser = true;
      this.error = "";

      try {
        await api.delete(`/users/${this.userToDelete.id}`);

        this.showDeleteModal = false;
        this.userToDelete = null;

        this.clearUsersCache();
        await this.fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
        this.error =
          error.response?.data?.message || "Failed to delete user.";
      } finally {
        this.deletingUser = false;
      }
    },

    getUsersCacheKey() {
      return "users-list";
    },

    clearUsersCache() {
      sessionStorage.removeItem(this.getUsersCacheKey());
    },

    toggleSidebar() {
      this.collapsed = !this.collapsed;
      localStorage.setItem("sidebar-collapsed", String(this.collapsed));
    },

    async handleLogout() {
      try {
        await api.post("/logout");
      } catch {
        // ignore
      } finally {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();
        this.$router.push("/login");
      }
    },

    getInitials(name) {
    if (!name) return "U";

      return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
    },

    formatRole(role) {
      if (!role) return "-";
      return role.charAt(0).toUpperCase() + role.slice(1);
    },

    formatDate(value) {
      if (!value) return "-";
      return new Date(value).toLocaleDateString("en-GB");
    },
  },
};
</script>

<style scoped>
.users-table td {
  padding-top: 12px;
  padding-bottom: 12px;
}

.users-table th:first-child,
.users-table td:first-child {
  padding-left: 18px;
}

.users-table th:last-child,
.users-table td:last-child {
  padding-right: 18px;
}

.users-table th:last-child {
  text-align: right;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 11px;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #f3f4f6;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10.5px;
  font-weight: 850;
  flex-shrink: 0;
}

.user-avatar.avatar-admin {
  background: #eef4ff;
  border-color: #d9e7ff;
  color: #2563eb;
}

.user-avatar.avatar-staff {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #6b7280;
}

.user-main {
  min-width: 0;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.8px;
  font-weight: 780;
  color: var(--text);
  line-height: 1.2;
}

.user-sub {
  margin-top: 3px;
  font-size: 11.3px;
  color: var(--text-muted);
}

.email-text {
  font-size: 12.8px;
  color: var(--text-soft);
}

@media (max-width: 900px) {
  .users-table {
    min-width: 760px;
  }
}
</style>