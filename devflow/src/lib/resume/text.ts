export const MAX_TEXT_LENGTH = 200_000
export const MAX_FILE_SIZE = 10 * 1024 * 1024
const SUPPORTED_EXTENSIONS = ['pdf', 'docx', 'txt', 'md']

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function assertResumeFile(file: File): void {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('文件不能超过 10MB')
  }

  const ext = file.name.split('.').pop()?.toLowerCase()

  if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error('只支持 PDF、DOCX、TXT、MD；旧版 .doc 请先另存为 .docx')
  }
}
