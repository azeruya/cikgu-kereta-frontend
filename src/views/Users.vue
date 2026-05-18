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
            <div class="page-title">Users</div>
            <span class="page-chip">{{ users.length }} users</span>
          </div>
          <div class="page-date">Manage staff and admin accounts for this branch</div>
        </div>

        <button class="pill-btn primary" @click="openModal()">+ Add User</button>
      </div>

      <Card>
        <template #header>
          <span class="card-title">User List</span>
        </template>

        <div v-if="loading" class="empty-state">Loading users...</div>

        <table v-else class="table">
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
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="status-pill" :class="user.role === 'admin' ? 'sp-blue' : 'sp-gray'">
                  {{ user.role }}
                </span>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              
                <td class="right">
                  <div class="action-icon-group" @click.stop>
                    <button
                      class="icon-action"
                      title="Edit user"
                      @click="openModal(user)"
                    >
                      <svg viewBox="0 0 24 24" class="icon-svg">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z" />
                      </svg>
                    </button>

                    <button
                      class="icon-action danger"
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

      <Teleport to="body">
        <div v-if="showModal" class="modal" @click.self="closeModal">
          <div class="modal-card large form-modal-card">
            <div class="modal-header">
              <span>{{ editingUserId ? "Edit User" : "Add User" }}</span>
              <button type="button" class="mini-btn" @click="closeModal">✕</button>
            </div>

            <div class="modal-body form-modal-body">
              <div class="form-section">
                <div class="section-title">User Information</div>

                <div class="form-grid user-form-grid">
                  <div class="field">
                    <label>Name</label>
                    <input v-model="form.name" type="text" placeholder="Full name" />
                  </div>

                  <div class="field">
                    <label>Email</label>
                    <input v-model="form.email" type="email" placeholder="Email address" />
                  </div>

                  <div class="field">
                    <label>Role</label>
                    <select v-model="form.role">
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div class="field">
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

            <div class="modal-actions form-actions">
              <button type="button" @click="closeModal">Cancel</button>
              <button
                type="button"
                class="primary"
                :disabled="saving"
                @click="saveUser"
              >
                {{ saving ? "Saving..." : (editingUserId ? "Update" : "Create") }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <Teleport to="body">
        <div
          v-if="showDeleteModal"
          class="delete-modal-overlay"
          @click.self="closeDeleteModal"
        >
          <div class="delete-modal-card">
            <div class="delete-icon">!</div>

            <div class="delete-title">Delete user?</div>

            <div class="delete-message">
              Are you sure you want to delete
              <strong>{{ userToDelete?.name }}</strong>?
              This action cannot be undone.
            </div>

            <div class="delete-actions">
              <button
                type="button"
                class="delete-cancel"
                :disabled="deletingUser"
                @click="closeDeleteModal"
              >
                Cancel
              </button>

              <button
                type="button"
                class="delete-confirm"
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
      collapsed: false,
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

    formatDate(value) {
      if (!value) return "-";
      return new Date(value).toLocaleDateString("en-GB");
    },
  },
};
</script>

<style scoped>
.right {
  text-align: right;
}

.action-icon-group {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 7px;
}

.icon-action {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  border: 1px solid #e6e6e6;
  background: #fff;
  color: #6f6f6f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.12s ease;
}

.icon-action:hover {
  color: #333;
  background: #f9f9f9;
  border-color: #d8d8d8;
}

.icon-action:active {
  transform: scale(0.96);
}

.icon-action.danger {
  color: #8a6a66;
  border-color: #efd8d5;
}

.icon-action.danger:hover {
  color: #b42318;
  background: #fff5f4;
  border-color: #f1b8b2;
}

.icon-action:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.icon-svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* modal */
.modal-card.large {
  width: min(520px, calc(100vw - 32px));
  border-radius: 18px;
  overflow: hidden;
}

.form-modal-card {
  width: min(560px, calc(100vw - 32px));
}

.modal-header {
  padding: 22px 38px 10px;
}

.modal-header span {
  font-size: 14.5px;
  font-weight: 700;
  color: #222;
}

.modal-body {
  padding: 10px 38px 16px;
}

.form-modal-body {
  padding-top: 10px;
}

.form-section {
  border: 1px solid #eeeeee;
  border-radius: 15px;
  padding: 16px;
  background: #fff;
}

.user-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 11px;
  font-weight: 700;
  color: #777;
}

.field input,
.field select {
  width: 100%;
  height: 40px;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  background: #fff;
  font-size: 13px;
  color: #222;
  outline: none;
  padding: 0 13px;
  box-sizing: border-box;
}

.field input:focus,
.field select:focus {
  border-color: #111;
}

.modal-actions.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding: 12px 32px 18px;
  border-top: 1px solid #eeeeee;
}

.modal-actions.form-actions button {
  height: 36px;
  min-width: 92px;
  padding: 0 14px;
  border-radius: 11px;
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}

.modal-actions.form-actions button.primary {
  min-width: 110px;
  background: #111;
  color: #fff;
  border-color: #111;
}

/* delete modal */
.delete-modal-overlay {
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

.delete-modal-card {
  width: min(360px, calc(100vw - 32px));
  background: #fff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
  text-align: center;
}

.delete-icon {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #fff1f0;
  color: #b42318;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  font-size: 18px;
  font-weight: 800;
}

.delete-title {
  font-size: 16px;
  font-weight: 700;
  color: #171717;
  margin-bottom: 8px;
}

.delete-message {
  font-size: 13px;
  line-height: 1.5;
  color: #666;
  margin-bottom: 20px;
}

.delete-message strong {
  color: #222;
}

.delete-actions {
  display: flex;
  gap: 10px;
}

.delete-actions button {
  flex: 1;
  height: 38px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.delete-cancel {
  border: 1px solid #e5e5e5;
  background: #fff;
  color: #333;
}

.delete-confirm {
  border: 1px solid #b42318;
  background: #b42318;
  color: #fff;
}

.table td {
  font-size: 13px;
  vertical-align: middle;
  padding: 5px 5px;
}

.table th {
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #999;
}

.status-pill {
  height: 22px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
}
</style>