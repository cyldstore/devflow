<template>
  <ToastRoot v-for="t in toasts" :key="t.id" :toast="t" as="li" class="toast-item">
    <div class="toast">
      <span class="icon" aria-hidden="true">
        <Check v-if="t.status === 'success'" :size="16" :stroke-width="2.4" />
        <AlertCircle v-else-if="t.status === 'error'" :size="16" :stroke-width="2.2" />
        <Info v-else :size="16" :stroke-width="2" />
      </span>

      <div class="content">
        <ToastTitle class="title" />
        <ToastDescription v-if="t.description" class="description" />
      </div>

      <div v-if="t.actionProps || t.data?.secondaryAction" class="actions">
        <button
          v-if="t.data?.secondaryAction"
          type="button"
          class="action secondary"
          @click="runSecondary(t.id, t.data.secondaryAction)"
        >
          {{ t.data.secondaryAction.label }}
        </button>

        <ToastAction v-if="t.actionProps" class="action" />
      </div>

      <ToastClose class="close" aria-label="关闭">
        <X :size="14" aria-hidden="true" />
      </ToastClose>
    </div>
  </ToastRoot>
</template>

<script setup lang="ts">
import { AlertCircle, Check, Info, X } from 'lucide-vue-next'
import {
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastRoot,
  ToastTitle,
  useToastManager,
} from 'reka-ui'

const { toasts, close } = useToastManager()

function runSecondary(id: string, action: { onClick: () => void }) {
  action.onClick()
  close(id)
}
</script>

<style scoped>
.toast-item {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}

.toast {
  position: relative;
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  grid-template-areas:
    'icon content'
    '. actions';
  column-gap: var(--space-3);
  width: 100%;
  padding: var(--space-5) var(--space-5) var(--space-4);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-toast);
}

.toast-item[data-status='success'] .toast {
  background: var(--color-toast-success-bg);
  border-color: var(--color-toast-success-border);
}

.toast-item[data-status='error'] .toast {
  background: var(--color-toast-error-bg);
  border-color: var(--color-toast-error-border);
}

.icon {
  grid-area: icon;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--color-background);
  color: var(--color-text);
}

.toast-item[data-status='success'] .icon {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

.toast-item[data-status='error'] .icon {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.content {
  grid-area: content;
  min-width: 0;
  padding-right: 24px;
}

.title {
  margin: 0;
  font-size: var(--text-base);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--color-text-strong);
}

.description {
  margin: 3px 0 0;
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  grid-area: actions;
  margin-top: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
}

.action {
  height: 28px;
  padding: 0 var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.toast-item[data-status='error'] .action {
  background: var(--color-danger);
}

.action:hover {
  opacity: 0.9;
}

.close {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
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
  background: rgb(23 26 22 / 0.06);
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

.toast-item[data-state='open'] .toast {
  animation: toast-in 180ms ease-out;
}

.toast-item[data-state='closed'] .toast {
  animation: toast-out 140ms ease-in forwards;
}

@media (prefers-reduced-motion: reduce) {
  .toast[data-state] {
    animation: none;
  }
}

.action.secondary {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid transparent;
}

.action.secondary:hover {
  background: var(--color-background);
  color: var(--color-text-strong);
}
</style>
