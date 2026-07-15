import client from './client'
import type { AcademicPeriod } from '@/types/academic-period'

export async function listAcademicPeriods(): Promise<AcademicPeriod[]> {
  const response = await client.get<AcademicPeriod[]>('/academic-periods')
  return response.data
}
