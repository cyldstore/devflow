<template>
  <div class="shell">
    <!-- 侧边栏 -->
    <AppSidebar />
    <div class="main">
      <!-- 顶栏 -->
      <AppTopbar />
      <main class="content">
        <RouterView />
      </main>
    </div>
    <!-- 移动端底部导航栏 -->
    <BottomNav />
    <ToastHost />
    <SettingsDialog />
  </div>
</template>

<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import BottomNav from './BottomNav.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import SettingsDialog from './SettingsDialog.vue'
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

@media (max-width: 1023px) {
  .shell {
    grid-template-columns: 72px 1fr;
  }
}

@media (max-width: 767px) {
  .shell {
    grid-template-columns: 1fr;
  }

  /* 与 BottomNav 的高度保持一致 */
  .content {
    padding: var(--space-5);
    padding-bottom: calc(56px + env(safe-area-inset-bottom) + var(--space-5));
  }
}
</style>
