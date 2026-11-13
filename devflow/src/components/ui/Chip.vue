<template>
  <span :class="['chip', `chip-${tone}`]">
    <span v-if="dot" class="chip-dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<script setup lang="ts">
type ChipTone = 'sage' | 'blue' | 'wood' | 'stone' | 'neutral' | 'lime' | 'coral' | 'amber'

withDefaults(
  defineProps<{
    tone?: ChipTone
    dot?: boolean
  }>(),
  {
    tone: 'neutral',
    dot: false,
  },
)
</script>

<style scoped>
.chip {
  --chip-fg: var(--color-tone-neutral-fg);
  --chip-bg: var(--color-tone-neutral-bg);

  height: 20px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
  color: var(--chip-fg);
  background: var(--chip-bg);
}

.chip-dot {
  width: 4px;
  height: 4px;
  border-radius: var(--radius-circle);
  background: currentColor;
  opacity: 0.8;
}

.chip-sage {
  --chip-fg: var(--color-tone-sage-fg);
  --chip-bg: var(--color-tone-sage-bg);
}

.chip-blue {
  --chip-fg: var(--color-tone-blue-fg);
  --chip-bg: var(--color-tone-blue-bg);
}

.chip-wood {
  --chip-fg: var(--color-tone-wood-fg);
  --chip-bg: var(--color-tone-wood-bg);
}

.chip-stone {
  --chip-fg: var(--color-tone-stone-fg);
  --chip-bg: var(--color-tone-stone-bg);
}

.chip-neutral {
  --chip-fg: var(--color-tone-neutral-fg);
  --chip-bg: var(--color-tone-neutral-bg);
}

.chip-lime {
  --chip-fg: var(--color-tone-lime-fg);
  --chip-bg: var(--color-tone-lime-bg);
}

.chip-coral {
  --chip-fg: var(--color-tone-coral-fg);
  --chip-bg: var(--color-tone-coral-bg);
}

.chip-amber {
  --chip-fg: var(--color-tone-amber-fg);
  --chip-bg: var(--color-tone-amber-bg);
}
</style>
