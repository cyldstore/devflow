<template>
  <div ref="el" class="chart" :style="{ height: `${height}px` }" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { EChartsType } from 'echarts/core'
import type { EChartsOption } from 'echarts'
import { echarts } from '@/lib/charts'

const props = withDefaults(defineProps<{ option: EChartsOption; height?: number }>(), {
  height: 240,
})

const el = ref<HTMLDivElement | null>(null)

let chart: EChartsType | null = null
let observer: ResizeObserver | null = null

onMounted(() => {
  if (!el.value) return

  chart = echarts.init(el.value)
  chart.setOption(props.option)

  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(el.value)
})

watch(
  () => props.option,
  (option) => chart?.setOption(option, true),
  { deep: true },
)

onBeforeUnmount(() => {
  observer?.disconnect()
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.chart {
  width: 100%;
}
</style>
