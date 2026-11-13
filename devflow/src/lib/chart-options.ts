import type { EChartsOption } from 'echarts'
import { tokenColor } from './charts'

export function studyBarOption(labels: string[], minutes: number[]): EChartsOption {
  return {
    grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: tokenColor('--line') } },
      axisTick: { show: false },
      axisLabel: { color: tokenColor('--muted'), fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: tokenColor('--line-soft') } },
      axisLabel: { color: tokenColor('--muted-2'), fontSize: 10 },
    },
    series: [
      {
        type: 'bar',
        name: '学习分钟',
        data: minutes,
        itemStyle: { color: tokenColor('--lime'), borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 18,
      },
    ],
  }
}
