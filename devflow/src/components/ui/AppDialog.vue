<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger as-child v-if="$slots.trigger">
      <slot name="trigger"></slot>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay class="overlay" />

      <DialogContent class="dialog">
        <DialogTitle class="dialog-title">{{ title }}</DialogTitle>
        <DialogDescription class="dialog-desc" v-if="description">{{
          description
        }}</DialogDescription>

        <div class="dialog-body">
          <slot />
        </div>

        <div class="dialog-actions">
          <slot name="footer">
            <DialogClose as-child>
              <Button variant="ghost">关闭</Button>
            </DialogClose>
          </slot>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<script lang="ts" setup>
import Button from '@/components/ui/Button.vue'
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

.dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 41;
  width: min(420px, calc(100vw - var(--space-8)));
  max-height: min(80dvh, 640px);
  overflow-y: auto;
  padding: var(--space-7);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-modal);
  outline: none;
}

.dialog-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  color: var(--color-text-strong);
}

.dialog-desc {
  margin: 0 0 var(--space-4);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--color-text-muted);
}

.dialog-body {
  margin: 0 0 var(--space-6);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-text);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
}
</style>
