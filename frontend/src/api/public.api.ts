import client from './client'

export interface PublicGroup {
  id: string
  name: string
  studentCount: number
  completionPct: number
}

export interface PublicSection {
  id: string
  code: string
  branchName: string
  groups: PublicGroup[]
}

export interface PublicCertification {
  id: string
  title: string
  category: string
  participating: number
  completionPct: number
}

export interface PublicStats {
  students: number
  sectionCount: number
  groups: number
  activeCertifications: number
  verifiedCertificates: number
  placementReadiness: number
  sections: PublicSection[]
  certifications: PublicCertification[]
}

export async function getPublicStats(): Promise<PublicStats> {
  const response = await client.get<PublicStats>('/public/stats')
  return response.data
}
