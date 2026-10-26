<template>
  <header class="topbar">
    <router-link class="brand" to="">
      <span class="brand-mark">D</span>
      <span>Devflow</span>
    </router-link>

    <input type="search" class="search" placeholder="搜索任务、编辑、公司..." aria-label="公司" />

    <div class="actions">
      <button type="button" class="icon-btn" aria-label="切换主题">主题</button>
      <button type="button" class="primary-btn">快速新建</button>
    </div>
  </header>
</template>
<script setup lang="ts"></script>

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
</style>
