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
  },
};
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #101010 0%, #070707 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.brand-row {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0 5px;
  min-height: 70px;
}

.brand-logo-only {
  width: 60px;
  height: 60px;
  object-fit: contain;
  opacity: 0.96;
}

.collapse-edge-btn {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.12);
  background: #1b1b1b;
  color: rgba(255,255,255,0.72);
  cursor: pointer;
  font-size: 17px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.collapse-edge-btn:hover {
  color: #fff;
  background: #2a2a2a;
}

.nav-divider {
  height: 1px;
  background: rgba(255,255,255,0.20);
  margin: 0 16px 12px;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 10px;
  overflow-y: auto;
}

.nav-item {
  height: 40px;
  border-radius: 11px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 11px;
  color: rgba(255,255,255,0.56);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
}

.nav-item:hover {
  background: rgba(255,255,255,0.06);
  color: #fff;
}

.router-link-active {
  background: rgba(255,255,255,0.13);
  color: #fff;
}

.nav-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.nav-text {
  white-space: nowrap;
}

.sidebar-foot {
  padding: 12px 10px 14px;
  border-top: 1px solid rgba(255,255,255,0.07);
}

.user-row {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255,255,255,0.045);
}

.avatar {
  width: 31px;
  height: 31px;
  border-radius: 9px;
  background: rgba(255,255,255,0.12);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.user-meta {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  margin-top: 2px;
  font-size: 10px;
  color: rgba(255,255,255,0.38);
}

.logout-icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(255,255,255,0.38);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.logout-icon-btn:hover {
  background: rgba(239,68,68,0.15);
  color: #f87171;
}

.logout-icon {
  width: 15px;
  height: 15px;
}

/* collapsed */
.sidebar.collapsed .brand-row {
  padding: 10px 0 10px;
  min-height: 62px;
}

.sidebar.collapsed .brand-logo-only {
  width: 48px;
  height: 48px;
}

.sidebar.collapsed .nav-divider {
  margin: 0 14px 10px;
}

.sidebar.collapsed .sidebar-nav {
  align-items: center;
  padding: 0 6px;
  gap: 7px;
}

.sidebar.collapsed .nav-item {
  width: 40px;
  height: 40px;
  padding: 0;
  justify-content: center;
}

.sidebar.collapsed .sidebar-foot {
  padding: 10px 6px 12px;
}

.sidebar.collapsed .user-row {
  flex-direction: column;
  gap: 8px;
  padding: 0;
  background: transparent;
}

.sidebar.collapsed .avatar,
.sidebar.collapsed .logout-icon-btn {
  width: 34px;
  height: 34px;
}
</style>