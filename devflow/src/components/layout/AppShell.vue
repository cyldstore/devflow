<template>
  <div class="shell">
    <AppSidebar />
    <div class="main">
      <AppTopbar />
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
</script>

<style scoped>
.shell {
  height: 100dvh;
  overflow: hidden;
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  background: var(--color-background);
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: var(--gutter-page);
}
</style>
