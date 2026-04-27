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
              <td>
                <div class="action-group">
                  <button class="mini-btn" @click="openModal(user)">Edit</button>
                  <button
                    class="mini-btn"
                    :disabled="user.id === currentUser?.id"
                    @click="deleteUser(user)"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Teleport to="body">
        <div v-if="showModal" class="modal" @click.self="closeModal">
          <div class="modal-card large">
            <div class="modal-header">
              <span>{{ editingUserId ? "Edit User" : "Add User" }}</span>
              <button class="mini-btn" @click="closeModal">✕</button>
            </div>

            <div class="modal-body">
              <div class="form-grid">
                <div class="field">
                  <label>Name</label>
                  <input v-model="form.name" type="text" />
                </div>

                <div class="field">
                  <label>Email</label>
                  <input v-model="form.email" type="email" />
                </div>

                <div class="field">
                  <label>Role</label>
                  <select v-model="form.role">
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div class="field">
                  <label>{{ editingUserId ? "New Password (optional)" : "Password" }}</label>
                  <input v-model="form.password" type="password" />
                </div>
              </div>

              <div v-if="formError" class="page-error">
                {{ formError }}
              </div>
            </div>

            <div class="modal-actions">
              <button @click="closeModal">Cancel</button>
              <button class="primary" :disabled="saving" @click="saveUser">
                {{ saving ? "Saving..." : "Save" }}
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
      this.loading = true;
      this.error = "";

      try {
        const res = await api.get("/users");
        this.users = res.data || [];
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
          payload.password = this.form.password;
          await api.post("/users", payload);
        }

        this.closeModal();
        await this.fetchUsers();
      } catch (error) {
        this.formError = error.response?.data?.message || "Failed to save user.";
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