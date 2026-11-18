import { assertResumeFile, MAX_TEXT_LENGTH, normalizeText } from '@/lib/resume/text'
import type { ResumeFileType } from '@/types'

export async function parseResumeFile(
  file: File,
): Promise<{ text: string; fileType: ResumeFileType; fileName: string }> {
  assertResumeFile(file)
  const ext = file.name.split('.').pop()?.toLowerCase()

  let raw: string
  let fileType: ResumeFileType

  if (ext === 'pdf') {
    raw = await parsePdf(file)
    fileType = 'pdf'
  } else if (ext === 'docx') {
    raw = await parseDocx(file)
    fileType = 'docx'
  } else {
    raw = await file.text()
    fileType = 'text'
  }

  const text = normalizeText(raw)

  if (text.length < 20) {
    throw new Error('没有提取到可用文本，可能是扫描版 PDF 或空文档')
  }

  return {
    text: text.slice(0, MAX_TEXT_LENGTH),
    fileType,
    fileName: file.name,
  }
}

async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ')
    pages.push(text)
  }

  return pages.join('\n\n')
}

export async function parseDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  })
  return result.value
}
