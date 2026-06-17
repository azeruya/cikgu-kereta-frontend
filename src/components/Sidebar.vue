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

    <div class="sidebar-foot">

      <div v-if="!collapsed" class="branch-card">
        <div class="branch-label">Current branch</div>
        <div class="branch-name">
          {{ branchName }}
        </div>
      </div>

      <div class="user-row">
        <div class="avatar">{{ initials }}</div>

        <div v-if="!collapsed" class="user-meta">
          <div class="user-name">{{ user?.name || "User" }}</div>
          <div class="user-role">{{ prettyRole }}</div>
        </div>

        <button class="logout-icon-btn" @click="$emit('logout')" title="Sign out" type="button">
          <svg class="logout-icon" viewBox="0 0 16 16" fill="none">
            <path d="M9.5 3H12.5V13H9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 5.5L3.5 8L7 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M4 8H10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
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
  width: 248px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  transition: width 0.2s ease;
  box-shadow: 1px 0 0 rgba(16, 24, 40, 0.02);
}

.sidebar.collapsed {
  width: 76px;
}

/* =========================
   BRAND
========================= */

.brand-row {
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 18px 18px 14px;
  min-height: 84px;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.brand-logo-only {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  object-fit: contain;
  opacity: 0.98;
  filter: drop-shadow(0 8px 16px rgba(16, 24, 40, 0.12));
}

.brand-text {
  min-width: 0;
}

.brand-name {
  font-size: 14px;
  font-weight: 850;
  color: #111827;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.brand-sub {
  margin-top: 3px;
  font-size: 10.5px;
  font-weight: 600;
  color: #8b95a1;
}

.collapse-edge-btn {
  position: absolute;
  right: -13px;
  top: 50%;
  transform: translateY(-50%);
  width: 27px;
  height: 27px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #6b7280;
  cursor: pointer;
  font-size: 17px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 8px 18px rgba(16, 24, 40, 0.1);
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease;
}

.collapse-edge-btn:hover {
  color: #111827;
  background: #f8fafc;
  border-color: #d1d5db;
}

.collapse-edge-btn:active {
  transform: translateY(-50%) scale(0.94);
}

.nav-divider {
  height: 1px;
  background: #eef0f3;
  margin: 0 18px 16px;
}

/* =========================
   NAVIGATION
========================= */

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 14px;
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
  height: 44px;
  border-radius: 13px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 13px;
  color: #6b7280;
  text-decoration: none;
  font-size: 14px;
  font-weight: 650;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.12s ease,
    box-shadow 0.15s ease;
}

.nav-item:hover {
  background: #f5f6f8;
  color: #111827;
}

.nav-item:active {
  transform: scale(0.985);
}

.router-link-active {
  background: #111827;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.14);
}

.nav-icon {
  width: 17px;
  height: 17px;
  flex-shrink: 0;
  opacity: 0.9;
}

.nav-text {
  white-space: nowrap;
}

/* =========================
   FOOTER USER AREA
========================= */

.sidebar-foot {
  padding: 14px 14px 16px;
  border-top: 1px solid #eef0f3;
  background: #ffffff;
}

.branch-card {
  margin-bottom: 10px;
  padding: 11px 12px;
  border-radius: 15px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.branch-label {
  font-size: 9px;
  font-weight: 850;
  color: #9aa3af;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 5px;
}

.branch-name {
  font-size: 12.5px;
  font-weight: 760;
  color: #111827;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px;
  border-radius: 15px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #111827;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 12.5px;
  font-weight: 760;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.user-role {
  margin-top: 3px;
  font-size: 10.5px;
  font-weight: 550;
  color: #8b95a1;
  line-height: 1.2;
}

.logout-icon-btn {
  width: 31px;
  height: 31px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  color: #8b95a1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease;
}

.logout-icon-btn:hover {
  background: #fff1f0;
  border-color: #f1b8b2;
  color: #b42318;
}

.logout-icon-btn:active {
  transform: scale(0.94);
}

.logout-icon {
  width: 15px;
  height: 15px;
}

/* =========================
   COLLAPSED STATE
========================= */

.sidebar.collapsed .brand-row {
  padding: 16px 0 12px;
  min-height: 74px;
  justify-content: center;
}

.sidebar.collapsed .brand-logo-only {
  width: 44px;
  height: 44px;
}

.sidebar.collapsed .brand-text {
  display: none;
}

.sidebar.collapsed .nav-divider {
  margin: 0 14px 14px;
}

.sidebar.collapsed .sidebar-nav {
  align-items: center;
  padding: 0 8px;
  gap: 8px;
  overflow: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.sidebar.collapsed .sidebar-nav::-webkit-scrollbar {
  display: none;
}

.sidebar.collapsed .sidebar-foot {
  padding: 14px 8px 16px;
  border-top: none;
}

.sidebar.collapsed .branch-card {
  display: none;
}

.sidebar.collapsed .nav-item {
  width: 44px;
  height: 44px;
  padding: 0;
  justify-content: center;
  border-radius: 14px;
}

.sidebar.collapsed .nav-icon {
  width: 17px;
  height: 17px;
}

.sidebar.collapsed .user-row {
  flex-direction: column;
  gap: 10px;
  padding: 8px 0;
  background: transparent;
  border: none;
}

.sidebar.collapsed .avatar,
.sidebar.collapsed .logout-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 13px;
}

.sidebar.collapsed .avatar {
  background: #111827;
}

.sidebar.collapsed .logout-icon-btn {
  background: #ffffff;
}
</style>