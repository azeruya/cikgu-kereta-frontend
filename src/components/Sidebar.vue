<template>
  <div class="sidebar" :class="{ collapsed }">
  <div class="brand-row">
  <button class="collapse-btn" @click="$emit('toggle')">
    <svg width="18" height="18" viewBox="0 0 16 16">
      <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5"/>
    </svg>
  </button>

  <!-- Expanded: full logo -->
  <img
    v-if="!collapsed"
    :src="textWhite"
    alt="Cikgu Kereta"
    class="brand-logo-full"
  />
</div>

<!-- Collapsed: icon centered below -->
<div v-if="collapsed" class="brand-collapsed-logo">
  <img :src="iconWhite" alt="Icon" class="brand-logo-icon" />
</div>

  <div class="sidebar-nav">
    <router-link
      v-for="item in menu"
      :key="item.path"
      :to="item.path"
      class="nav-item"
    >
      <svg v-if="item.icon === 'grid'" class="nav-icon" viewBox="0 0 16 16">
        <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.4"/>
      </svg>

      <svg v-else-if="item.icon === 'briefcase'" class="nav-icon" viewBox="0 0 16 16">
        <rect x="2" y="5" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M6 5V4a2 2 0 014 0v1" stroke="currentColor" stroke-width="1.5"/>
        <path d="M2 9h12" stroke="currentColor" stroke-width="1.5"/>
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

      <button
        class="logout-icon-btn"
        @click="$emit('logout')"
        title="Logout"
        type="button"
      >
        <svg class="logout-icon" viewBox="0 0 16 16" fill="none">
          <path
            d="M9.5 3H12.5V13H9.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M7 5.5L3.5 8L7 10.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M4 8H10.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </div>
</div>
</template>

<script>
import textWhite from "../assets/text-white.png";
import iconWhite from "../assets/icon-white.png";

export default {
  props: {
    collapsed: Boolean,
    menu: Array,
    user: Object
  },

  emits: ["toggle", "logout"],

  data() {
    return {
      textWhite,
      iconWhite,
    };
  },

  computed: {
    initials() {
      const name = this.user?.name || "User";
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    },

    prettyRole() {
      const role = this.user?.role || "staff";
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
  }
};
</script>

<style scoped>
.user-meta {
  min-width: 0;
  flex: 1;
}

.sidebar {
  background: linear-gradient(180deg, #101010 0%, #070707 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 12px 0 30px rgba(0, 0, 0, 0.08);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px 18px;
  min-height: 72px;
}

.brand-logo-full {
  height: 24px;
  width: auto;
  object-fit: contain;
  display: block;
}

.brand-collapsed-logo {
  display: flex;
  justify-content: center;
  padding: 4px 0 10px;   
  margin-top: -8px;      
}

.brand-logo-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
  opacity: 0.9;
  transition: all 0.2s ease;
}

.brand-logo-icon:hover {
  opacity: 1;
  transform: scale(1.05);
}

.sidebar.collapsed .brand-row {
  justify-content: center;
  padding: 18px 0 2px;
  min-height: auto;
}

.sidebar.collapsed .brand-logo-area {
  justify-content: center;
  flex: unset;
}

.nav-item {
  height: 44px;
  border-radius: 14px;
  padding: 0 14px;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 600;
  transition: all 0.18s ease;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
}

.router-link-active {
  background: rgba(255, 255, 255, 0.13);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.sidebar-foot {
  margin-top: auto;
  padding: 16px 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.user-row {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16px;
  padding: 10px;
}

.avatar {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.logout-icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.logout-icon-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
}

.logout-icon {
  width: 17px;
  height: 17px;
}

.logout-icon-btn,
.collapse-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
}

.sidebar.collapsed .user-row {
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}

</style>