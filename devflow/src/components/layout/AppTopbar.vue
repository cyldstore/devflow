<template>
  <header class="topbar">
    <RouterLink class="brand" to="/" aria-label="DevFlow 首页">
      <span class="brand-mark">D</span>
      <span class="brand-name">DevFlow</span>
    </RouterLink>

    <input
      type="search"
      class="search"
      placeholder="搜索任务、笔记、公司..."
      aria-label="全局搜索"
    />

    <div class="actions">
      <Button variant="ghost" aria-label="切换主题">主题</Button>
      <Button variant="lime">
        <Plus :size="14" aria-hidden="true" />
        快速新建
      </Button>
    </div>
  </header>
</template>
<script setup lang="ts">
import { Plus } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
</script>

<style scoped>
.topbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: 64px;
  padding: 0 var(--gutter-page);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: none;
}

.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm);
  display: grid;
  place-items: center;
  background: var(--color-accent);
  color: var(--color-accent-contrast);
  font-weight: 800;
}

.search {
  flex: 1 1 0;
  min-width: 0;
  max-width: 420px;
  height: 34px;
  padding: 0 var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  color: var(--color-text);
}

.search:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 1px;
}

.actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: none;
}

@media (max-width: 767px) {
  .topbar {
    gap: var(--space-3);
    padding: 0 var(--space-5);
  }

  .brand-name {
    display: none;
  }

  .actions {
    gap: var(--space-2);
  }
}

.brand:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}
</style>
