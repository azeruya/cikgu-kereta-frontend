<template>
  <div class="sidebar" :class="{ collapsed }">
    <div class="brand-row">
      <img :src="vulcanLogo" alt="Vulcan Auto Service" class="brand-logo-only" />

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
  width: 240px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 28%),
    linear-gradient(180deg, #111 0%, #070707 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  transition: width 0.2s ease;
}

.sidebar.collapsed {
  width: 74px;
}

/* =========================
   BRAND
========================= */
.brand-row {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 18px 0 14px;
  min-height: 86px;
}

.brand-logo-only {
  width: 58px;
  height: 58px;
  object-fit: contain;
  opacity: 0.98;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.35));
}

.collapse-edge-btn {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 25px;
  height: 25px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  background: #1b1b1b;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  font-size: 17px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.collapse-edge-btn:hover {
  color: #fff;
  background: #2a2a2a;
  border-color: rgba(255, 255, 255, 0.22);
}

.nav-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.14);
  margin: 0 20px 16px;
}

/* =========================
   NAVIGATION
========================= */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 16px;
  overflow-y: auto;
}

.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 999px;
}

.nav-item {
  height: 46px;
  border-radius: 13px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  gap: 13px;
  color: rgba(255, 255, 255, 0.56);
  text-decoration: none;
  font-size: 14px;
  font-weight: 550;
  transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
}

.nav-item:active {
  transform: scale(0.985);
}

.router-link-active {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.17),
    rgba(255, 255, 255, 0.11)
  );
  color: #fff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 10px 24px rgba(0, 0, 0, 0.22);
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
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: transparent;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.055);
  box-shadow: none;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.1));
  color: #fff;
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
  font-weight: 750;
  color: rgba(255, 255, 255, 0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.user-role {
  margin-top: 3px;
  font-size: 10.5px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.42);
  line-height: 1.2;
}

.logout-icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.035);
  color: rgba(255, 255, 255, 0.48);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;
}

.logout-icon-btn:hover {
  background: rgba(239, 68, 68, 0.16);
  color: #f87171;
}

.logout-icon-btn:active {
  transform: scale(0.94);
}

.logout-icon {
  width: 15px;
  height: 15px;
}

/* =========================
.branch-card {
  margin-bottom: 10px;
  padding: 10px 11px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.055);
}

.branch-label {
  font-size: 9.5px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.36);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.branch-name {
  font-size: 12px;
  font-weight: 750;
  color: rgba(255, 255, 255, 0.86);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
========================= */

.branch-card {
  margin-bottom: 10px;
  padding: 11px 12px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.055);
}

.branch-label {
  font-size: 9px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.38);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 5px;
}

.branch-name {
  font-size: 12.5px;
  font-weight: 750;
  color: rgba(255, 255, 255, 0.9);
}

/* =========================
   COLLAPSED STATE
========================= */
.sidebar.collapsed .brand-row {
  padding: 14px 0 12px;
  min-height: 74px;
}

.sidebar.collapsed .brand-logo-only {
  width: 46px;
  height: 46px;
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
  box-shadow: none;
}

.sidebar.collapsed .avatar,
.sidebar.collapsed .logout-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 13px;
}

.sidebar.collapsed .avatar {
  background: rgba(255, 255, 255, 0.12);
}

.sidebar.collapsed .logout-icon-btn {
  background: rgba(255, 255, 255, 0.055);
}
</style>
