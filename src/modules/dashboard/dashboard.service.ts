import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AdminDashboardDto } from './dto/admin-dashboard.dto';
import { MentorDashboardDto, MentorFollowUpItemDto } from './dto/mentor-dashboard.dto';
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
  rejected: string;
  availableOpportunities: string;
}

function toFloat(v: string): number {
  return parseFloat(v);
}

function completionRate(verified: number, submitted: number, rejected: number): number {
  const total = submitted + verified + rejected;
  if (total === 0) return 0;
  return Math.round((verified / total) * 10000) / 100;
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

interface MentorFollowUpRow {
  rollNumber: string;
  studentName: string;
  groupName: string | null;
  opportunityTitle: string;
  status: string;
  participationId: string;
  submittedAt: string | null;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getAdminDashboard(): Promise<AdminDashboardDto> {
    const [row] = await this.dataSource.query<CountRow[]>(
      `SELECT
        (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e WHERE e.is_active = true AND e.deleted_at IS NULL) AS "totalStudents",
        (SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL) AS "totalOpportunities",
        (SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL AND state IN ('published','open')) AS "activeOpportunities",
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
        (SELECT COUNT(*) FROM sections WHERE mentor_user_id = $1 AND deleted_at IS NULL) AS "assignedSections",
        (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1 AND e.deleted_at IS NULL AND s.deleted_at IS NULL) AS "totalStudents",
        (SELECT COUNT(DISTINCT p.opportunity_id) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1 AND e.deleted_at IS NULL AND s.deleted_at IS NULL) AS "opportunitiesActive",
        (SELECT COUNT(*) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1 AND e.deleted_at IS NULL AND s.deleted_at IS NULL AND p.status = 'submitted') AS "submitted",
        (SELECT COUNT(*) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1 AND e.deleted_at IS NULL AND s.deleted_at IS NULL AND p.status = 'verified') AS "verified",
        (SELECT COUNT(*) FROM participations p
          JOIN enrollments e ON p.enrollment_id = e.id
          JOIN sections s ON e.section_id = s.id
          WHERE s.mentor_user_id = $1 AND e.deleted_at IS NULL AND s.deleted_at IS NULL AND p.status = 'rejected') AS "rejected"`,
      [userId],
    );
    const v = toFloat(row.verified);
    const s = toFloat(row.submitted);
    const r = toFloat(row.rejected);

    const followUpRows = await this.dataSource.query<MentorFollowUpRow[]>(
      `SELECT
        en.roll_number AS "rollNumber",
        u.name AS "studentName",
        g.name AS "groupName",
        o.title AS "opportunityTitle",
        p.status AS "status",
        p.id AS "participationId",
        p.submitted_at AS "submittedAt"
      FROM participations p
      JOIN enrollments en ON p.enrollment_id = en.id
      JOIN sections s ON en.section_id = s.id
      JOIN users u ON en.user_id = u.id
      JOIN opportunities o ON p.opportunity_id = o.id
      LEFT JOIN groups g ON en.group_id = g.id
      WHERE s.mentor_user_id = $1
        AND en.deleted_at IS NULL AND s.deleted_at IS NULL
        AND p.status IN ('submitted', 'in_progress')`,
      [userId],
    );

    const followUpQueue: MentorFollowUpItemDto[] = followUpRows
      .map((row) => ({
        rollNumber: row.rollNumber ?? '—',
        studentName: row.studentName ?? 'Unknown',
        groupName: row.groupName ?? '—',
        opportunityTitle: row.opportunityTitle,
        status: row.status,
        participationId: row.participationId,
        submittedAt: row.submittedAt,
        daysPending: daysSince(row.submittedAt),
      }))
      .sort((a, b) => b.daysPending - a.daysPending)
      .slice(0, 20);

    return {
      assignedSections: toFloat(row.assignedSections),
      totalStudents: toFloat(row.totalStudents),
      opportunitiesActive: toFloat(row.opportunitiesActive),
      submitted: s,
      verified: v,
      rejected: r,
      completionRate: completionRate(v, s, r),
      followUpQueue,
    };
  }

  async getTeamLeaderDashboard(userId: string): Promise<TeamLeaderDashboardDto> {
    const [row] = await this.dataSource.query<TlRow[]>(
      `SELECT
        (SELECT COUNT(*) FROM groups WHERE team_leader_user_id = $1 AND deleted_at IS NULL) AS "assignedGroups",
        (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e
          JOIN groups g ON e.group_id = g.id
          WHERE g.team_leader_user_id = $1 AND e.deleted_at IS NULL AND g.deleted_at IS NULL) AS "students",
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
          (SELECT id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL)) AS "assignedOpportunities",
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL) AND status = 'in_progress') AS "inProgress",
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL) AND status = 'submitted') AS "submitted",
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL) AND status = 'verified') AS "verified",
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL) AND status = 'completed') AS "completed",
        (SELECT COUNT(*) FROM participations WHERE enrollment_id IN
          (SELECT id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL) AND status = 'rejected') AS "rejected",
        (SELECT COUNT(*) FROM opportunities o WHERE o.deleted_at IS NULL AND o.state IN ('published','open')
          AND o.id NOT IN (SELECT p.opportunity_id FROM participations p WHERE p.enrollment_id IN
            (SELECT id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL))
          AND (o.target_branch_id IS NULL OR o.target_branch_id IN
            (SELECT branch_id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL))
          AND (o.target_section_id IS NULL OR o.target_section_id IN
            (SELECT section_id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL))
          AND (o.target_batch_id IS NULL OR o.target_batch_id IN
            (SELECT batch_id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL))
          AND (o.target_group_id IS NULL OR o.target_group_id IN
            (SELECT group_id FROM enrollments WHERE user_id = $1 AND deleted_at IS NULL))
        ) AS "availableOpportunities"`,
      [userId],
    );
    return {
      assignedOpportunities: toFloat(row.assignedOpportunities),
      inProgress: toFloat(row.inProgress),
      submitted: toFloat(row.submitted),
      verified: toFloat(row.verified),
      completed: toFloat(row.completed),
      rejected: toFloat(row.rejected),
      availableOpportunities: toFloat(row.availableOpportunities),
    };
  }
}
