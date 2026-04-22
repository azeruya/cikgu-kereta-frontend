<template>
  <div class="sidebar" :class="{ collapsed }">
    <div class="brand-row">
      <button class="collapse-btn" @click="$emit('toggle')">
        <svg width="18" height="18" viewBox="0 0 16 16">
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </button>

      <div v-if="!collapsed">
        <div class="brand-name">Cikgu Kereta</div>
        <div class="brand-sub">Workshop</div>
      </div>
    </div>

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

    <div class="sidebar-foot">
      <div class="user-row">
        <div class="avatar">{{ initials }}</div>
        <div v-if="!collapsed">
          <div class="user-name">{{ user?.name || "User" }}</div>
          <div class="user-role">{{ prettyRole }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    collapsed: Boolean,
    menu: Array,
    user: Object
  },
  emits: ["toggle"],
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