export interface UserEnrollment {
  id: string
  academicPeriodId: string
  branchId: string
  sectionId: string
  groupId?: string
  batchId: string
  rollNumber?: string
}

export interface User {
  id: string
  email: string
  name: string
  roles: string[]
  isStudent?: boolean
  mustChangePassword?: boolean
  enrollment?: UserEnrollment
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}
