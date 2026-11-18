import { parseDocx } from '@/lib/resume/parse'
import type { ResumeParseRequest, ResumeParseResponse } from '@/lib/resume/protocol'
import { normalizeText, MAX_TEXT_LENGTH, assertResumeFile } from '@/lib/resume/text'

self.onmessage = async (event: MessageEvent<ResumeParseRequest>) => {
  const { id, file } = event.data
  const ext = file.name.split('.').pop()?.toLowerCase()

  try {
    assertResumeFile(file)

    let raw: string
    let fileType: 'docx' | 'text'

    if (ext === 'docx') {
      raw = await parseDocx(file)
      fileType = 'docx'
    } else if (ext === 'txt' || ext === 'md') {
      raw = await file.text()
      fileType = 'text'
    } else {
      throw new Error('该格式交给主线程处理')
    }

    const text = normalizeText(raw)
    if (text.length < 20) {
      throw new Error('没有提取到可用文本，可能是空文档')
    }

    const response: ResumeParseResponse = {
      id,
      ok: true,
      text: text.slice(0, MAX_TEXT_LENGTH),
      fileType,
      fileName: file.name,
    }
    self.postMessage(response)
  } catch (error) {
    const original = error instanceof Error ? error.message : '解析失败'

    const message =
      ext === 'docx' ? 'DOCX 解析失败，文件可能已损坏或不是有效的 Word 文档' : original

    self.postMessage({ id, ok: false, message })
  }
}
