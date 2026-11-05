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

      <AppDialog
        v-model:open="demoOpen"
        title="示例对话框"
        description="Reka UI 只提供行为，外观全部由我们决定。"
      >
        <template #trigger>
          <Button variant="ghost">打开对话框</Button>
        </template>
        <p>按 Esc 关闭；Tab 会在对话框内循环；关闭后焦点回到触发按钮。</p>

        <template #footer>
          <Button variant="ghost" @click="demoOpen = false">取消</Button>
          <Button variant="lime" @click="demoOpen = false">知道了</Button>
        </template>
      </AppDialog>

      <AppDrawer
        v-model:open="drawerOpen"
        title="任务详情"
        description="抽屉用于编辑，不会打断当前上下文。"
      >
        <template #trigger>
          <Button variant="ghost">打开抽屉</Button>
        </template>
        <p>这里是抽屉的内容区，内容多的时候只有这块会滚动。</p>

        <template #footer>
          <Button variant="ghost" @click="drawerOpen = false">取消</Button>
          <Button variant="lime" @click="drawerOpen = false">保存</Button>
        </template>
      </AppDrawer>
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from '@/components/ui/Card.vue'
import Chip from '@/components/ui/Chip.vue'
import PagePlaceholder from '@/components/ui/PagePlaceholder.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
import Button from '@/components/ui/Button.vue'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import { ref } from 'vue'

const demoOpen = ref(false)
const drawerOpen = ref(false)
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
