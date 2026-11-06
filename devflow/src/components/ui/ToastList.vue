<template>
  <ToastRoot v-for="t in toasts" :key="t.id" :toast="t" as="li" class="toast">
    <span class="dot" aria-hidden="true" />

    <div class="content">
      <ToastTitle class="title" />
      <ToastDescription v-if="t.description" class="description" />
    </div>

    <ToastAction v-if="t.actionProps" class="action" />
    <ToastClose class="close" aria-label="关闭">
      <X :size="14" aria-hidden="true" />
    </ToastClose>
  </ToastRoot>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRoot,
  ToastTitle,
  useToastManager,
} from 'reka-ui'

const { toasts } = useToastManager()
</script>

<style scoped>
.toast {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  margin: 0;
  padding: var(--space-4) var(--space-4) var(--space-4) var(--space-6);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-toast);
  list-style: none;
  overflow: hidden;
}

.toast::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--color-text-faint);
}

.toast[data-status='success']::before {
  background: var(--color-accent-strong);
}

.toast[data-status='error']::before {
  background: var(--color-danger);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-circle);
  background: var(--color-text-faint);
}

.toast[data-status='success'] .dot {
  background: var(--color-accent-strong);
}

.toast[data-status='error'] .dot {
  background: var(--color-danger);
}

.content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-strong);
}

.description {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action {
  height: 26px;
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-tone-lime-fg);
  font-family: inherit;
  font-size: var(--text-xs);
  font-weight: 600;
  cursor: pointer;
}

.action:hover {
  background: var(--color-accent-soft);
}

.close {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-faint);
  cursor: pointer;
}

.close:hover {
  background: var(--color-background);
  color: var(--color-text-strong);
}

.action:focus-visible,
.close:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes toast-out {
  to {
    opacity: 0;
    transform: translateY(4px) scale(0.98);
  }
}

.toast[data-state='open'] {
  animation: toast-in 180ms ease-out;
}

.toast[data-state='closed'] {
  animation: toast-out 140ms ease-in forwards;
}

@media (prefers-reduced-motion: reduce) {
  .toast[data-state] {
    animation: none;
  }
}
</style>
