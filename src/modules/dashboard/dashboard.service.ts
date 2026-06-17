import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import { MentorDashboardDto } from './dto/mentor-dashboard.dto';
import { TeamLeaderDashboardDto } from './dto/team-leader-dashboard.dto';
import { StudentDashboardDto } from './dto/student-dashboard.dto';

interface CountRow {
  totalStudents: string;
  totalOpportunities: string;
  activeOpportunities: string;
  participations: string;
  submitted: string;
  verified: string;
  rejected: string;
}

interface MentorRow {
  assignedSections: string;
  totalStudents: string;
  opportunitiesActive: string;
  submitted: string;
  verified: string;
  rejected: string;
}

interface TlRow {
  assignedGroups: string;
  students: string;
  pendingVerifications: string;
  verified: string;
  rejected: string;
}

interface StudentRow {
  assignedOpportunities: string;
  inProgress: string;
  submitted: string;
  verified: string;
  completed: string;
}

function toFloat(v: string): number {
  return parseFloat(v);
}

function completionRate(verified: number, submitted: number, rejected: number): number {
  const total = submitted + verified + rejected;
  if (total === 0) return 0;
  return Math.round((verified / total) * 10000) / 100;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getAdminDashboard(): Promise<AdminDashboardDto> {
    const [row] = await this.dataSource.query<CountRow[]>(
      `SELECT
        (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e WHERE e.is_active = true) AS "totalStudents",
        (SELECT COUNT(*) FROM opportunities) AS "totalOpportunities",
        (SELECT COUNT(*) FROM opportunities WHERE state IN ('published','open')) AS "activeOpportunities",
        (SELECT COUNT(*) FROM participations) AS "participations",
        (SELECT COUNT(*) FROM participations WHERE status = 'submitted') AS "submitted",
        (SELECT COUNT(*) FROM participations WHERE status = 'verified') AS "verified",
        (SELECT COUNT(*) FROM participations WHERE status = 'rejected') AS "rejected"`,
    );
    const p = toFloat(row.participations);
    const v = toFloat(row.verified);
    const s = toFloat(row.submitted);
    const r = toFloat(row.rejected);
    return {
      totalStudents: toFloat(row.totalStudents),
      totalOpportunities: toFloat(row.totalOpportunities),
      activeOpportunities: toFloat(row.activeOpportunities),
      participations: p,
      submitted: s,
      verified: v,
      rejected: r,
      completionRate: completionRate(v, s, r),
    };
  }

  async getMentorDashboard(userId: string): Promise<MentorDashboardDto> {
    const [row] = await this.dataSource.query<MentorRow[]>(
      `SELECT
        (SELECT COUNT(*) FROM sections WHERE mentor_user_id = $1) AS "assignedSections",
        (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1) AS "totalStudents",
        (SELECT COUNT(DISTINCT p.opportunity_id) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1) AS "opportunitiesActive",
        (SELECT COUNT(*) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1 AND p.status = 'submitted') AS "submitted",
        (SELECT COUNT(*) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1 AND p.status = 'verified') AS "verified",
        (SELECT COUNT(*) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1 AND p.status = 'rejected') AS "rejected"`,
      [userId],
    );
    const v = toFloat(row.verified);
    const s = toFloat(row.submitted);
    const r = toFloat(row.rejected);
    return {
      assignedSections: toFloat(row.assignedSections),
      totalStudents: toFloat(row.totalStudents),
      opportunitiesActive: toFloat(row.opportunitiesActive),
      submitted: s,
      verified: v,
      rejected: r,
      completionRate: completionRate(v, s, r),
    };
  }

  async getTeamLeaderDashboard(userId: string): Promise<TeamLeaderDashboardDto> {
    const [row] = await this.dataSource.query<TlRow[]>(
      `SELECT
        (SELECT COUNT(*) FROM groups WHERE team_leader_user_id = $1) AS "assignedGroups",
        (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e
          JOIN groups g ON e.group_id = g.id
          WHERE g.team_leader_user_id = $1) AS "students",
        (SELECT COUNT(*) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN groups g ON e.group_id = g.id
          WHERE g.team_leader_user_id = $1 AND p.status = 'submitted') AS "pendingVerifications",
        (SELECT COUNT(*) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN groups g ON e.group_id = g.id
          WHERE g.team_leader_user_id = $1 AND p.status = 'verified') AS "verified",
        (SELECT COUNT(*) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN groups g ON e.group_id = g.id
          WHERE g.team_leader_user_id = $1 AND p.status = 'rejected') AS "rejected"`,
      [userId],
    );
    return {
      assignedGroups: toFloat(row.assignedGroups),
      students: toFloat(row.students),
      pendingVerifications: toFloat(row.pendingVerifications),
      verified: toFloat(row.verified),
      rejected: toFloat(row.rejected),
    };
  }

  async getStudentDashboard(userId: string): Promise<StudentDashboardDto> {
    const [row] = await this.dataSource.query<StudentRow[]>(
      `SELECT
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1)) AS "assignedOpportunities",
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1) AND status = 'in_progress') AS "inProgress",
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1) AND status = 'submitted') AS "submitted",
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1) AND status = 'verified') AS "verified",
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1) AND status = 'completed') AS "completed"`,
      [userId],
    );
    return {
      assignedOpportunities: toFloat(row.assignedOpportunities),
      inProgress: toFloat(row.inProgress),
      submitted: toFloat(row.submitted),
      verified: toFloat(row.verified),
      completed: toFloat(row.completed),
    };
  }
}
