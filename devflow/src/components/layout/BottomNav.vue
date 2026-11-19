<!-- 移动端底部导航栏 -->
<template>
  <nav class="bottom-nav" aria-label="移动端主导航">
    <RouterLink v-for="item in items" :key="item.to" :to="item.to" class="tab">
      <component :is="item.icon" :size="20" :stroke-width="1.8" aria-hidden="true"></component>
      <span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { BookOpen, Briefcase, LayoutGrid, SquareCheck } from 'lucide-vue-next'

interface NavItem {
  to: string
  label: string
  icon: Component
}

const items: NavItem[] = [
  { to: '/', label: '概览', icon: LayoutGrid },
  { to: '/tasks', label: '任务', icon: SquareCheck },
  { to: '/knowledge', label: '知识库', icon: BookOpen },
  { to: '/jobs', label: '求职', icon: Briefcase },
]
</script>

<style scoped>
.bottom-nav {
  display: none;
}

@media (max-width: 767px) {
  .bottom-nav {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 10;
    display: flex;
    height: calc(56px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom); /* iphone安全线 */
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
  }

  .tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    font-size: var(--text-2xs);
    color: var(--color-text-muted);
  }

  .tab.router-link-exact-active {
    color: var(--color-text-strong);
  }

  .tab:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: -2px;
  }
}
</style>
