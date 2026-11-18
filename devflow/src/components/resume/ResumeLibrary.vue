<template>
  <section class="resume-library">
    <header class="library-head">
      <div>
        <h2>简历库</h2>
        <p>上传一次，投递时从这里选择。</p>
      </div>
      <div class="library-actions">
        <Button variant="lime" :disabled="uploading" @click="openFilePicker">
          {{ uploading ? `解析中 ${progress.done}/${progress.total}` : '上传简历' }}
        </Button>
        <input
          ref="fileInput"
          type="file"
          accept=".pdf,.docx,.txt,.md"
          multiple
          hidden
          @change="onFileChange"
        />
      </div>
    </header>

    <p v-if="uploading" class="progress" role="status">
      正在解析 {{ progress.done }} / {{ progress.total }}
    </p>

    <ul v-if="failures.length > 0" class="error-list" role="alert">
      <li v-for="(item, index) in failures" :key="`${item.fileName}-${index}`">
        {{ item.fileName }}：{{ item.message }}
      </li>
    </ul>

    <div v-if="resumes.length === 0" class="empty">
      <p>还没有简历。</p>
      <p>支持 PDF、DOCX、TXT、MD；旧版 .doc 请先另存为 .docx。</p>
    </div>

    <ul v-else class="resume-list">
      <li v-for="resume in resumes" :key="resume.id" class="resume-item">
        <div class="resume-info">
          <h3>{{ resume.title }}</h3>
          <p class="meta">
            {{ typeLabel(resume.fileType) }} · 更新于 {{ resume.updatedAt.slice(0, 10) }}
          </p>
        </div>

        <div class="resume-actions">
          <Button
            variant="ghost"
            size="sm"
            @click="previewId = previewId === resume.id ? null : resume.id"
          >
            {{ previewId === resume.id ? '收起' : '查看' }}
          </Button>
          <Button variant="ghost" size="sm" class="danger-text" @click="remove(resume)">
            删除
          </Button>
        </div>

        <pre v-if="previewId === resume.id" class="resume-content">{{ resume.content }}</pre>
      </li>
    </ul>

    <details class="paste-fallback">
      <summary>解析失败？粘贴简历文本</summary>
      <textarea v-model="pastedText" class="input textarea" rows="6" placeholder="粘贴简历纯文本" />
      <Button variant="ghost" size="sm" :disabled="!pastedText.trim()" @click="savePasted">
        保存为简历
      </Button>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, onScopeDispose, reactive, ref } from 'vue'
import Button from '@/components/ui/Button.vue'
import { useDatabase } from '@/stores/db'
import { addResume, removeResume } from '@/stores/resumes'
import { parseResumeFile } from '@/lib/resume/parse'
import { createResumeParser } from '@/lib/resume/parse-client'
import { toast } from '@/lib/toast'
import type { Resume, ResumeFileType } from '@/types'

const db = useDatabase()
const resumes = computed(() => db.resumes)

const fileInput = ref<HTMLInputElement | null>(null)
const parser = createResumeParser()
const uploading = ref(false)
const progress = reactive({ done: 0, total: 0 })
const failures = ref<{ fileName: string; message: string }[]>([])
const previewId = ref<string | null>(null)
const pastedText = ref('')

onScopeDispose(() => parser.dispose())

const TYPE_LABELS: Record<ResumeFileType, string> = {
  pdf: 'PDF',
  docx: 'DOCX',
  text: '文本',
}

function typeLabel(type?: ResumeFileType): string {
  return type ? TYPE_LABELS[type] : '简历'
}

function openFilePicker(): void {
  fileInput.value?.click()
}

interface ParsedResume {
  text: string
  fileType: ResumeFileType
  fileName: string
}

async function parseOne(file: File): Promise<ParsedResume> {
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') {
    return parseResumeFile(file)
  }

  return parser.parse(file)
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items]
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift()
      if (!item) return
      await task(item)
    }
  })

  await Promise.all(runners)
}

async function onFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''

  if (files.length === 0) return

  uploading.value = true
  failures.value = []
  progress.done = 0
  progress.total = files.length

  const uploaded: string[] = []

  try {
    await runWithConcurrency(files, 2, async (file) => {
      try {
        const parsed = await parseOne(file)
        const title = file.name.replace(/\.[^.]+$/, '')

        addResume({
          title,
          content: parsed.text,
          fileName: parsed.fileName,
          fileType: parsed.fileType,
        })

        uploaded.push(title)
      } catch (err) {
        failures.value.push({
          fileName: file.name,
          message: err instanceof Error ? err.message : '简历解析失败',
        })
      } finally {
        progress.done += 1
      }
    })
  } finally {
    uploading.value = false
  }

  if (uploaded.length > 0) {
    toast.add({
      title: uploaded.length === 1 ? '简历已上传' : `已上传 ${uploaded.length} 份简历`,
      description: uploaded.length === 1 ? uploaded[0] : undefined,
      status: 'success',
      duration: 3000,
    })
  }
}

function savePasted(): void {
  const content = pastedText.value.trim()
  if (!content) return

  addResume({ title: '粘贴的简历', content, fileType: 'text' })
  pastedText.value = ''
  toast.add({ title: '简历已保存', status: 'success', duration: 3000 })
}

function remove(resume: Resume): void {
  const usedBy = db.applications.filter((app) => app.resumeId === resume.id).length
  const message = usedBy > 0 ? `${usedBy} 个投递正在使用，删除后会变未选择` : '确定删除这份简历？'

  toast.add({
    title: '删除',
    description: message,
    status: 'error',
    duration: 8000,
    actionProps: {
      label: '删除',
      altText: '确认删除简历',
      onClick: () => {
        removeResume(resume.id)
        if (previewId.value === resume.id) previewId.value = null
        toast.add({ title: '简历已删除', status: 'success', duration: 3000 })
      },
    },
  })
}
</script>

<style scoped>
.resume-library {
  display: grid;
  gap: var(--space-5);
}

.library-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.library-head h2 {
  margin: 0;
  font-size: var(--text-lg);
  color: var(--color-text-strong);
}

.library-head p {
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.library-actions {
  display: flex;
  gap: var(--space-2);
}

.empty {
  padding: var(--space-8);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  text-align: center;
}

.empty p {
  margin: var(--space-1) 0;
}

.resume-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: var(--space-3);
}

.resume-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.resume-info h3 {
  margin: 0;
  font-size: var(--text-base);
  color: var(--color-text-strong);
}

.meta {
  margin: var(--space-1) 0 0;
  color: var(--color-text-faint);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
}

.resume-actions {
  display: flex;
  align-items: start;
  gap: var(--space-1);
}

.resume-content {
  grid-column: 1 / -1;
  max-height: 320px;
  overflow: auto;
  margin: var(--space-2) 0 0;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-background);
  white-space: pre-wrap;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
}

.paste-fallback {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.paste-fallback summary {
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.paste-fallback .input {
  margin-top: var(--space-3);
}

.progress {
  margin: calc(-1 * var(--space-2)) 0 0;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--color-text-faint);
}

.error-list {
  margin: 0;
  padding: var(--space-4);
  list-style: none;
  display: grid;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-background);
  color: var(--coral);
  font-size: var(--text-sm);
}
</style>
