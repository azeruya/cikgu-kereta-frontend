<template>
  <div class="sidebar" :class="{ collapsed }">
    <div class="brand-row">
      <img :src="vulcanLogo" alt="Vulcan Auto Service" class="brand-logo" />
      <button class="collapse-btn" @click="$emit('toggle')" type="button" :title="collapsed ? 'Expand' : 'Collapse'">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path :d="collapsed ? 'M4 2l4 4-4 4' : 'M8 2L4 6l4 4'" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
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
        <div class="branch-label">Branch</div>
        <div class="branch-name">{{ branchName }}</div>
      </div>

      <div class="user-row">
        <div class="avatar">{{ initials }}</div>
        <div v-if="!collapsed" class="user-meta">
          <div class="user-name">{{ user?.name || 'User' }}</div>
          <div class="user-role">{{ prettyRole }}</div>
        </div>
        <button class="logout-btn" @click="$emit('logout')" title="Sign out" type="button">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
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
      return this.menu.filter(item => !["/reports", "/users"].includes(item.path));
    },
    branchName() {
      return this.user?.branch?.name || "Main Workshop";
    },
  },
};
</script>

<style scoped>
/* ── BASE ── */
.sidebar {
  width: 232px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #111111 0%, #070707 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  transition: width 0.2s ease;
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 68px;
}

/* ── BRAND ── */
.brand-row {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0 16px;
  min-height: 88px;
}

.brand-logo {
  width: 54px;
  height: 54px;
  object-fit: contain;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.4));
}

.sidebar.collapsed .brand-logo {
  width: 42px;
  height: 42px;
}

.collapse-btn {
  position: absolute;
  right: -11px;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #1c1c1c;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.collapse-btn:hover {
  background: #2a2a2a;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.22);
}

/* ── DIVIDER ── */
.nav-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 18px 12px;
}

.sidebar.collapsed .nav-divider {
  margin: 0 12px 12px;
}

/* ── NAV ── */
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px;
  overflow-y: auto;
  scrollbar-width: none;
}

.sidebar-nav::-webkit-scrollbar { display: none; }

.nav-item {
  height: 42px;
  border-radius: 10px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 11px;
  color: rgba(255, 255, 255, 0.48);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition: background 0.13s, color 0.13s;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 255, 255, 0.85);
}

.router-link-active {
  background: rgba(180, 28, 28, 0.22);
  color: #f87171;
  position: relative;
}

.router-link-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 2.5px;
  border-radius: 0 2px 2px 0;
  background: #B41C1C;
}

.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.nav-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── COLLAPSED NAV ── */
.sidebar.collapsed .nav-item {
  width: 42px;
  height: 42px;
  padding: 0;
  justify-content: center;
  border-radius: 10px;
}

.sidebar.collapsed .sidebar-nav {
  align-items: center;
  padding: 0 6px;
}

/* ── FOOTER ── */
.sidebar-foot {
  padding: 12px 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.branch-card {
  margin-bottom: 8px;
  padding: 10px 11px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.branch-label {
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.32);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.branch-name {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(180, 28, 28, 0.35);
  color: #f87171;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  margin-top: 2px;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.38);
}

.logout-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255, 255, 255, 0.36);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.14s, color 0.14s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

/* ── COLLAPSED FOOTER ── */
.sidebar.collapsed .sidebar-foot {
  padding: 12px 6px 14px;
  border-top: none;
}

.sidebar.collapsed .branch-card {
  display: none;
}

.sidebar.collapsed .user-row {
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  background: transparent;
  border: none;
}

.sidebar.collapsed .avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.sidebar.collapsed .logout-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.36);
}
</style>