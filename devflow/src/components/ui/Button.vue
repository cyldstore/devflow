<template>
  <button :class="['btn', `btn-${variant}`, `btn-${size}`]" type="button">
    <slot />
  </button>
</template>

<script setup lang="ts">
type ButtonVariant = 'primary' | 'lime' | 'ghost' | 'quiet' | 'danger'
type ButtonSize = 'md' | 'sm'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
  }>(),
  {
    variant: 'ghost',
    size: 'md',
  },
)
</script>

<style scoped>
.btn {
  height: 35px;
  padding: 0 var(--space-6);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: 650;
  cursor: pointer;
  white-space: nowrap;
}

.btn:focus-visible {
  outline: 2px solid var(--color-text-strong);
  outline-offset: 2px;
}

.btn-sm {
  height: 30px;
  padding: 0 var(--space-5);
  font-size: var(--text-xs);
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-lime {
  background: var(--color-accent);
  color: var(--color-accent-contrast);
}

.btn-ghost {
  background: var(--color-background);
  border-color: var(--color-border);
  color: var(--color-text);
}

.btn-quiet {
  background: transparent;
  color: var(--color-text-muted);
}

.btn-danger {
  background: var(--color-danger);
  color: var(--color-on-primary);
}
</style>
