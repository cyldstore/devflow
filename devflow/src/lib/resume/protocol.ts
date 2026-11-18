export interface ResumeParseRequest {
  id: string
  file: File
}

export type ResumeParseResponse =
  | { id: string; ok: true; text: string; fileType: 'docx' | 'text'; fileName: string }
  | { id: string; ok: false; message: string }
