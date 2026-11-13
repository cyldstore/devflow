<template>
  <div class="card">
    <slot />
  </div>
</template>

<style scoped>
.card {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
</style>
