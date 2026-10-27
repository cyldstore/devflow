<template>
  <ToastProvider :toast-manager="toast" :duration="4000" label="通知">
    <ToastList />
    <ToastViewport class="viewport" />
  </ToastProvider>
</template>

<script setup lang="ts">
import { ToastProvider, ToastViewport } from 'reka-ui'
import { toast } from '@/lib/toast'
import ToastList from './ToastList.vue'
</script>

<style scoped>
.viewport {
  position: fixed;
  right: var(--space-6);
  bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: min(360px, calc(100vw - var(--space-8)));
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 767px) {
  .viewport {
    left: var(--space-4);
    right: var(--space-4);
    bottom: calc(56px + env(safe-area-inset-bottom) + var(--space-4));
    width: auto;
  }
}
</style>
