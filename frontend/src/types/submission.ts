export interface SubmissionFile {
  id: string
  fileReferenceId: string
  bucket: string
  key: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  createdAt: string
}

export interface Submission {
  id: string
  participationId: string
  submittedBy: string
  description: string | null
  externalLinks: object | null
  submittedAt: string
  isLate: boolean
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  files?: SubmissionFile[]
}
