<template>
  <ToastRoot v-for="t in toasts" :key="t.id" :toast="t" class="toast">
    <ToastTitle class="title" />
    <ToastDescription v-if="t.description" class="description" />
    <ToastClose class="close" aria-label="关闭">×</ToastClose>
  </ToastRoot>
</template>

<script setup lang="ts">
import { ToastClose, ToastDescription, ToastRoot, ToastTitle, useToastManager } from 'reka-ui'

const { toasts } = useToastManager()
</script>

<style scoped>
.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-strong);
}

.description {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.close {
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: var(--text-lg);
  line-height: 1;
  cursor: pointer;
}

.close:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}
</style>
