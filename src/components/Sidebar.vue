<template>
  <div class="sidebar" :class="{ collapsed }">
    <div class="brand-row">
      <div class="brand-lockup"> 
        <img :src="vulcanLogo" alt="Vulcan Auto Service" class="brand-logo-only" />

        <div v-if="!collapsed" class="brand-text">
          <div class="brand-name">Vulcan Auto</div>
          <div class="brand-sub">Workshop System</div>
        </div>

      </div>

      <button class="collapse-edge-btn" @click="$emit('toggle')" type="button">
        <span>{{ collapsed ? "›" : "‹" }}</span>
      </button>
    </div>

    <div class="nav-divider"></div>

    <div class="sidebar-nav">
      <router-link
        v-for="item in visibleMenu"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :title="item.name"
      >
        <!-- keep your existing svg icons here exactly as they are -->
        <svg v-if="item.icon === 'grid'" class="nav-icon" viewBox="0 0 16 16">
          <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
          <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
          <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
          <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/>
        </svg>

        <svg v-else-if="item.icon === 'list'" class="nav-icon" viewBox="0 0 16 16">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>

        <svg v-else-if="item.icon === 'user'" class="nav-icon" viewBox="0 0 16 16">
          <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/>
          <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5" stroke="currentColor" stroke-width="1.5"/>
        </svg>

        <svg v-else-if="item.icon === 'box'" class="nav-icon" viewBox="0 0 16 16">
          <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M5 6V4a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5"/>
        </svg>

        <svg v-else-if="item.icon === 'chart'" class="nav-icon" viewBox="0 0 16 16">
          <path d="M2 13l3-3 3 3 3-5 3 5" stroke="currentColor" stroke-width="1.5"/>
        </svg>

        <svg v-else-if="item.icon === 'alert'" class="nav-icon" viewBox="0 0 16 16">
          <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/>
          <path d="M8 5v3M8 11h.01" stroke="currentColor" stroke-width="1.5"/>
        </svg>

        <span v-if="!collapsed" class="nav-text">{{ item.name }}</span>
      </router-link>
    </div>

    <div v-if="!collapsed" class="sidebar-foot">
      <div class="workspace-card">
        <div class="workspace-label">Current Branch</div>

        <div class="workspace-main">
          <div class="workspace-avatar">
            {{ initials }}
          </div>

          <div class="workspace-meta">
            <div class="workspace-branch">{{ branchName }}</div>
            <div class="workspace-user">
              {{ user?.name || "User" }} · {{ prettyRole }}
            </div>
          </div>

          <button class="logout-icon-btn" @click="$emit('logout')" title="Logout" type="button">
            <svg class="logout-icon" viewBox="0 0 16 16" fill="none">
              <path d="M9.5 3H12.5V13H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 5.5L3.5 8L7 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 8H10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import vulcanLogo from "../assets/vulcan_bg.png";

export default {
  props: {
    collapsed: Boolean,
    menu: Array,
    user: Object,
  },

  emits: ["toggle", "logout"],

  data() {
    return { vulcanLogo };
  },

  computed: {
    initials() {
      const name = this.user?.name || "User";
      return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    },

    prettyRole() {
      const role = this.user?.role || "staff";
      return role.charAt(0).toUpperCase() + role.slice(1);
    },

    visibleMenu() {
      const role = this.user?.role || "staff";
      if (role === "admin") return this.menu;

      return this.menu.filter(item => {
        return !["/reports", "/users"].includes(item.path);
      });
    },

    branchName() {
      return this.user?.branch?.name || "Main Workshop";
    },
  },
};
</script>

<style scoped>
.sidebar {
  width: 236px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e0e6ef;
  transition: width 0.2s ease;
}

.sidebar.collapsed {
  width: 72px;
}

/* Brand */
.brand-row {
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 18px 16px 14px;
  min-height: 78px;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.brand-logo-only {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  object-fit: contain;
  opacity: 0.98;
  filter: drop-shadow(0 6px 12px rgba(15, 23, 42, 0.12));
}

.brand-text {
  min-width: 0;
}

.brand-name {
  font-size: 14px;
  font-weight: 850;
  color: #0f172a;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.brand-sub {
  margin-top: 2px;
  font-size: 10.5px;
  font-weight: 650;
  color: #8a94a6;
  line-height: 1.1;
  font-style: italic;
}

.collapse-edge-btn {
  position: absolute;
  right: -13px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid #dfe5ee;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  transition: all 0.15s ease;
}

.collapse-edge-btn:hover {
  color: #0f172a;
  background: #f8fafc;
  border-color: #cbd5e1;
}

.collapse-edge-btn:active {
  transform: translateY(-50%) scale(0.94);
}

.nav-divider {
  height: 1px;
  background: #edf1f6;
  margin: 0 16px 14px;
}

/* Nav */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
  overflow-y: auto;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: #d8dde5;
  border-radius: 999px;
}

.nav-item {
  height: 40px;
  border-radius: 10px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 11px;
  color: #667085;
  text-decoration: none;
  font-size: 13px;
  font-weight: 760;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background: #f4f6f9;
  color: #0f172a;
}

.nav-item:active {
  transform: scale(0.985);
}

.router-link-active {
  background: #111827;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
}

.nav-icon {
  width: 16.5px;
  height: 16.5px;
  flex-shrink: 0;
  opacity: 0.88;
}

.nav-text {
  white-space: nowrap;
}

/* Footer */
.sidebar-foot {
  padding: 12px;
  border-top: 1px solid #edf1f6;
  background: #ffffff;
}

.workspace-card {
  padding: 11px;
  border-radius: 13px;
  background: #f8fafc;
  border: 1px solid #dfe5ee;
}

.workspace-label {
  font-size: 8.8px;
  font-weight: 850;
  color: #9aa3af;
  text-transform: uppercase;
  letter-spacing: 0.11em;
  margin-bottom: 9px;
}

.workspace-main {
  display: flex;
  align-items: center;
  gap: 9px;
}

.workspace-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #111827;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11.5px;
  font-weight: 850;
  flex-shrink: 0;
}

.workspace-meta {
  flex: 1;
  min-width: 0;
}

.workspace-branch {
  font-size: 12.4px;
  font-weight: 850;
  color: #0f172a;
  line-height: 1.2;
}

.workspace-user {
  margin-top: 2px;
  font-size: 10.5px;
  color: #8a94a6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-icon-btn {
  width: 30px;
  height: 30px;
  border: 1px solid #dfe5ee;
  border-radius: 9px;
  background: #ffffff;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.logout-icon-btn:hover {
  background: #fff1f0;
  border-color: #efb5ad;
  color: #b42318;
}

.logout-icon-btn:active {
  transform: scale(0.94);
}

.logout-icon {
  width: 14.5px;
  height: 14.5px;
}

/* Collapsed */
.sidebar.collapsed .brand-row {
  padding: 15px 0 12px;
  min-height: 68px;
  justify-content: center;
}

.sidebar.collapsed .brand-logo-only {
  width: 40px;
  height: 40px;
}

.sidebar.collapsed .brand-text {
  display: none;
}

.sidebar.collapsed .nav-divider {
  margin: 0 12px 12px;
}

.sidebar.collapsed .sidebar-nav {
  align-items: center;
  padding: 0 8px;
  gap: 7px;
  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sidebar.collapsed .sidebar-nav::-webkit-scrollbar {
  display: none;
}

.sidebar.collapsed .sidebar-foot {
  display: none;
}

.sidebar.collapsed .nav-item {
  width: 42px;
  height: 42px;
  padding: 0;
  justify-content: center;
  border-radius: 12px;
}

.sidebar.collapsed .nav-icon {
  width: 16.5px;
  height: 16.5px;
}
</style>