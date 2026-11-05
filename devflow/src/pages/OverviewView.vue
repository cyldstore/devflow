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

      <DialogRoot v-model:open="demoOpen">
        <DialogTrigger as-child>
          <Button variant="ghost">打开示例对话框</Button>
        </DialogTrigger>

        <DialogPortal>
          <DialogOverlay class="overlay" />

          <DialogContent class="dialog">
            <DialogTitle class="dialog-title">示例对话框</DialogTitle>
            <DialogDescription class="dialog-desc">
              Reka UI 只提供行为：焦点、Esc、无障碍语义；外观全部由我们决定。
            </DialogDescription>

            <p class="dialog-body">
              按 Esc 关闭；Tab 会在对话框内循环；关闭后焦点回到"打开示例对话框"。
            </p>

            <div class="dialog-actions">
              <DialogClose as-child>
                <Button variant="lime">知道了</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </DialogPortal>
      </DialogRoot>
    </div>
  </Card>
</template>

<script setup lang="ts">
import Card from '@/components/ui/Card.vue'
import Chip from '@/components/ui/Chip.vue'
import PagePlaceholder from '@/components/ui/PagePlaceholder.vue'
import Button from '@/components/ui/Button.vue'
import { ref } from 'vue'
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

const demoOpen = ref(false)
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
