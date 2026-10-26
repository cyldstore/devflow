<template>
  <div class="app-shell">
    <header class="debug-nav">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">D</span>
        <span>DevFlow</span>
      </RouterLink>
      <nav aria-label="主导航">
        <RouterLink to="/">概览</RouterLink>
        <RouterLink to="/tasks">任务</RouterLink>
        <RouterLink to="/knowledge">知识库</RouterLink>
        <RouterLink to="/jobs">求职</RouterLink>
        <RouterLink to="/insights">复盘</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f2f0e9;
}

.debug-nav {
  height: 64px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  background: var(--color-sidebar);
  color: var(--color-on-sidebar);
  border-bottom: 1px solid var(--color-sidebar-line);
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: none;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.035em;
}

.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--color-accent);
  color: #171a16;
  font-weight: 800;
}

nav {
  display: flex;
  gap: 3px;
  overflow-x: auto;
}

nav a {
  height: 32px;
  padding: 0 11px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  flex: none;
  color: #aeb5a7;
  font-size: 12px;
  white-space: nowrap;
}

nav a:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
}

nav a.router-link-active {
  background: #252b22;
  color: #ffffff;
}

@media (max-width: 760px) {
  .debug-nav {
    padding: 0 16px;
    gap: 14px;
  }

  .brand span:last-child {
    display: none;
  }

  nav a {
    padding: 0 8px;
    font-size: 11px;
  }
}
</style>
