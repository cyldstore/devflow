<template>
  <section class="placeholder">
    <span class="signal" aria-hidden="true"></span>
    <p class="eyebrow">{{ index }} / DEVFLOW</p>
    <h1>{{ title }}</h1>
    <p class="description">{{ description }}</p>
    <p class="hint">页面将在 C2 开始实现</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  index: string
  title: string
  description: string
}>()
</script>

<style scoped>
.placeholder {
  min-height: calc(100vh - 64px);
  padding: 64px 48px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
}

.signal {
  width: 7px;
  height: 7px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: #a7dd3f;
  box-shadow: 0 0 0 5px rgba(167, 221, 63, 0.14);
}

.eyebrow {
  margin: 0 0 10px;
  color: #8b9084;
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(42px, 6vw, 76px);
  line-height: 1;
  letter-spacing: -0.06em;
  font-weight: 650;
}

.description {
  max-width: 520px;
  margin: 0 0 22px;
  color: #747a6e;
  font-size: 14px;
  line-height: 1.7;
}

.hint {
  margin: 0;
  color: #a1a599;
  font-family: 'Cascadia Code', Consolas, monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>
