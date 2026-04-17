<template>
  <div class="card">
    <div class="card-head" v-if="$slots.header">
      <slot name="header" />
    </div>

    <div class="card-body">
      <slot />
    </div>

    <div class="card-foot" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script>
export default {
  name: "Card",
};
</script>