<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child v-if="$slots.trigger">
      <slot name="trigger" />
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="overlay" />

      <DialogContent class="drawer">
        <header class="drawer-head">
          <DialogTitle class="drawer-title">{{ title }}</DialogTitle>
          <DialogClose as-child>
            <button type="button" class="drawer-close" aria-label="关闭">
              <X :size="16" aria-hidden="true" />
            </button>
          </DialogClose>
        </header>

        <DialogDescription v-if="description" class="drawer-desc">
          {{ description }}
        </DialogDescription>

        <div class="drawer-body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="drawer-footer">
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'

defineProps<{
  title: string
  description?: string
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: var(--color-overlay);
}

.drawer {
  position: fixed;
  inset: 0 0 0 auto;
  z-index: 41;
  width: min(420px, 100vw);
  display: flex;
  flex-direction: column;
  background: var(--color-surface-raised);
  border-left: 1px solid var(--color-border);
  box-shadow: var(--shadow-modal);
  outline: none;
}

.drawer-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6) var(--space-7);
  border-bottom: 1px solid var(--color-border);
}

.drawer-title {
  flex: 1;
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-text-strong);
}

.drawer-close {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.drawer-close:hover {
  background: var(--color-background);
  color: var(--color-text-strong);
}

.drawer-desc {
  flex: none;
  margin: 0;
  padding: var(--space-5) var(--space-7) 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.drawer-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-7);
}

.drawer-footer {
  flex: none;
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-7);
  border-top: 1px solid var(--color-border);
}

@keyframes overlay-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes drawer-in {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.overlay[data-state='open'] {
  animation: overlay-in 180ms ease-out;
}

.drawer[data-state='open'] {
  animation: drawer-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.overlay[data-state='closed'] {
  animation: overlay-in 160ms ease-in reverse;
}

.drawer[data-state='closed'] {
  animation: drawer-in 200ms ease-in reverse;
}

@media (prefers-reduced-motion: reduce) {
  .overlay[data-state],
  .drawer[data-state] {
    animation: none;
  }
}
</style>
