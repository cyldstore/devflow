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
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from '@/components/ui/Card.vue'
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
</style>
