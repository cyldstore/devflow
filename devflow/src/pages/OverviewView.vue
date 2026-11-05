<template>
  <PagePlaceholder
    index="01"
    title="概览"
    description="今日聚焦、本周学习目标与求职下一步会在这里汇总。"
  />

  <!-- 临时：验证 Card 组件，C4 实现概览页时删除 -->
  <Card class="demo-card">
    <div class="demo-body">
      <h2 class="demo-title">卡片标题</h2>
      <p class="demo-text">
        这是一段用来验证卡片内边距和文字排版的占位内容，长度足够换行，可以看到行高。
      </p>

      <div class="demo-chips">
        <Chip tone="sage" dot>学习</Chip>
        <Chip tone="blue" dot>求职</Chip>
        <Chip tone="wood">项目</Chip>
        <Chip tone="stone">生活</Chip>
        <Chip tone="coral">逾期</Chip>
        <Chip tone="amber">进行中</Chip>
        <Chip tone="lime">已完成</Chip>
        <Chip>待定</Chip>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from '@/components/ui/Card.vue'
import Chip from '@/components/ui/Chip.vue'
import PagePlaceholder from '@/components/ui/PagePlaceholder.vue'
</script>

<style scoped>
.demo-card {
  margin-top: var(--space-7);
}

.demo-body {
  padding: var(--space-7);
}

.demo-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-lg);
  color: var(--color-text-strong);
}

.demo-text {
  margin: 0;
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--color-text-muted);
}

.demo-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}
</style>
