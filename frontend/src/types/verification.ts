export interface PendingSubmission {
  submissionId: string
  participationId: string
  opportunityTitle: string
  opportunityId: string
  studentName: string
  studentEmail: string
  submittedAt: string
  description: string | null
  fileCount: number
}

export interface VerificationLog {
  id: string
  submissionId: string
  action: string
  actorUserId: string
  reason: string | null
  createdAt: string
  actor?: { name: string }
  submission?: { participation?: { status: string } }
}

export interface RejectSubmissionDto {
  reason: string
}
