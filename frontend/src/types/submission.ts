export interface SubmissionFile {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  storagePath: string
  createdAt: string
}

export interface Submission {
  id: string
  participationId: string
  description: string | null
  submittedAt: string
  rejectionReason: string | null
  files: SubmissionFile[]
}
