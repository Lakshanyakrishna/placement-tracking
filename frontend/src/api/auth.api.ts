import client, { setAccessToken } from './client'
import type { LoginRequest, LoginResponse, User } from '@/types/auth'

interface RawRole {
  role: string
  scopeType: string
  scopeId: string | null
}

interface RawEnrollment {
  id: string
  academicPeriodId: string
  branchId: string
  sectionId: string
  groupId?: string
  batchId: string
  rollNumber?: string
}

interface RawUser {
  id: string
  email: string
  name: string
  isActive: boolean
  mustChangePassword: boolean
  roles: RawRole[]
  enrollment: RawEnrollment | null
}

function toUser(raw: RawUser): User {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name,
    roles: raw.roles.map((r) => r.role),
    isStudent: raw.enrollment !== null,
    mustChangePassword: raw.mustChangePassword,
    enrollment: raw.enrollment ?? undefined,
  }
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await client.post<{ accessToken: string; user: RawUser }>('/auth/login', data)
  const user = toUser(response.data.user)
  setAccessToken(response.data.accessToken)
  return { accessToken: response.data.accessToken, user }
}

export async function logout(): Promise<void> {
  try {
    await client.post('/auth/logout')
  } finally {
    setAccessToken(null)
  }
}

export async function refresh(): Promise<{ accessToken: string }> {
  const response = await client.post<{ accessToken: string }>('/auth/refresh', {}, { _isRefresh: true } as any)
  setAccessToken(response.data.accessToken)
  return response.data
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await client.post('/auth/change-password', { currentPassword, newPassword })
}

export async function forgotPassword(email: string): Promise<void> {
  await client.post('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await client.post('/auth/reset-password', { token, password })
}
