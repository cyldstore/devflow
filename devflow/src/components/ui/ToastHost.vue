<template>
  <div class="toast-host">
    <ToastProvider :toast-manager="toast" :duration="4000" label="通知">
      <ToastViewport class="viewport">
        <ToastList />
      </ToastViewport>
    </ToastProvider>
  </div>
</template>

<script setup lang="ts">
import { ToastProvider, ToastViewport } from 'reka-ui'
import { toast } from '@/lib/toast'
import ToastList from './ToastList.vue'
</script>

<style scoped>
.toast-host {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

:deep(.viewport) {
  position: absolute;
  right: var(--space-6);
  bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: min(360px, calc(100vw - var(--space-8)));
  max-height: 70dvh;
  margin: 0;
  padding: 0;
  list-style: none;
  outline: none;
  pointer-events: auto;
}

@media (max-width: 767px) {
  :deep(.viewport) {
    left: var(--space-4);
    right: var(--space-4);
    bottom: calc(56px + env(safe-area-inset-bottom) + var(--space-4));
    width: auto;
  }
}
</style>
