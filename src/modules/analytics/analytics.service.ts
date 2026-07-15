import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IamService } from '../iam/iam.service';
import { GroupCertificationSummaryDto, CertificationOpportunityBreakdownDto } from './dto/certification-breakdown.dto';

type RequestUser = { id: string; roles?: Array<{ role: string }>; isStudent?: boolean };

interface CertificationBreakdownRow {
  group_id: string;
  group_name: string;
  team_leader_name: string | null;
  opportunity_id: string | null;
  title: string | null;
  opportunity_type: string | null;
  state: string | null;
  total_students: string;
  not_started: string;
  in_progress: string;
  submitted: string;
  verified: string;
  completed: string;
  rejected: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly iamService: IamService,
  ) {}

  async getCertificationBreakdown(user: RequestUser): Promise<GroupCertificationSummaryDto[]> {
    const isAdmin = (user.roles ?? []).some((r) => r.role === 'admin');
    const isMentor = (user.roles ?? []).some((r) => r.role === 'mentor');

    let sectionIds: string[] | null = null;

    if (!isAdmin) {
      if (!isMentor) {
        throw new ForbiddenException('You do not have permission to view certification analytics');
      }
      const sections = await this.iamService.findMentorSections(user.id);
      if (sections.length === 0) {
        return [];
      }
      sectionIds = sections.map((s) => s.id);
    }

    const rows = await this.dataSource.query<CertificationBreakdownRow[]>(
      `SELECT
         g.id AS group_id,
         g.name AS group_name,
         tl.name AS team_leader_name,
         o.id AS opportunity_id,
         o.title AS title,
         o.opportunity_type AS opportunity_type,
         o.state AS state,
         COUNT(DISTINCT e.id) AS total_students,
         COUNT(p.id) FILTER (WHERE p.status = 'not_started') AS not_started,
         COUNT(p.id) FILTER (WHERE p.status = 'in_progress') AS in_progress,
         COUNT(p.id) FILTER (WHERE p.status = 'submitted') AS submitted,
         COUNT(p.id) FILTER (WHERE p.status = 'verified') AS verified,
         COUNT(p.id) FILTER (WHERE p.status = 'completed') AS completed,
         COUNT(p.id) FILTER (WHERE p.status = 'rejected') AS rejected
       FROM groups g
       LEFT JOIN users tl ON tl.id = g.team_leader_user_id
       JOIN enrollments e ON e.group_id = g.id AND e.deleted_at IS NULL AND e.is_active = true
       LEFT JOIN opportunities o ON (
             (o.target_group_id = g.id OR (o.target_group_id IS NULL AND o.target_section_id = g.section_id))
             AND o.opportunity_type NOT IN ('placement', 'internship')
             AND o.state NOT IN ('draft', 'cancelled')
             AND o.deleted_at IS NULL
           )
       LEFT JOIN participations p ON p.opportunity_id = o.id AND p.enrollment_id = e.id
       WHERE g.deleted_at IS NULL
         AND ($1::uuid[] IS NULL OR g.section_id = ANY($1::uuid[]))
       GROUP BY g.id, g.name, tl.name, o.id, o.title, o.opportunity_type, o.state, o.created_at
       ORDER BY g.name, o.created_at`,
      [sectionIds],
    );

    const groupMap = new Map<string, GroupCertificationSummaryDto>();

    for (const row of rows) {
      if (!groupMap.has(row.group_id)) {
        groupMap.set(row.group_id, {
          groupId: row.group_id,
          groupName: row.group_name,
          teamLeaderName: row.team_leader_name,
          certifications: [],
        });
      }

      if (row.opportunity_id === null) {
        // Group has no certifications posted yet — leave its list empty.
        continue;
      }

      const totalStudents = Number(row.total_students);
      const verified = Number(row.verified);
      const completed = Number(row.completed);
      const completionRate = totalStudents > 0 ? Math.round(((verified + completed) / totalStudents) * 100) : 0;

      const entry: CertificationOpportunityBreakdownDto = {
        opportunityId: row.opportunity_id,
        title: row.title!,
        opportunityType: row.opportunity_type!,
        state: row.state!,
        totalStudents,
        notStarted: Number(row.not_started),
        inProgress: Number(row.in_progress),
        submitted: Number(row.submitted),
        verified,
        completed,
        rejected: Number(row.rejected),
        completionRate,
      };

      groupMap.get(row.group_id)!.certifications.push(entry);
    }

    return Array.from(groupMap.values());
  }
}
