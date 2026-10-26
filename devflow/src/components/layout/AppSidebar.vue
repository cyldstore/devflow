<template>
  <aside class="sidebar">
    <nav class="nav" aria-label="主导航">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item">{{
        item.label
      }}</RouterLink>
    </nav>
  </aside>
</template>

<script setup lang="ts">
const navItems = [
  { to: '/', label: '概览' },
  { to: '/tasks', label: '任务' },
  { to: '/knowledge', label: '知识库' },
  { to: '/jobs', label: '求职' },
  { to: '/insights', label: '复盘' },
]
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  padding: var(--space-5) var(--space-3);
  background: var(--color-sidebar);
  color: var(--color-on-sidebar);
  overflow-y: auto;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: 38px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-on-sidebar);
  opacity: 0.68;
}

.nav-item:hover {
  background: var(--color-sidebar-raised);
  opacity: 1;
}

.nav-item.router-link-exact-active {
  background: var(--color-sidebar-raised);
  opacity: 1;
}

.nav-item:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}
</style>
