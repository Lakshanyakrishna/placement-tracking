import { Controller, Get, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from '../../common/decorators/public.decorator';

@Controller('public')
export class PublicController {
  private readonly logger = new Logger(PublicController.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get('stats')
  async getStats() {
    const studentCount = await this.getCount('users', 'is_active = true');
    const sectionCount = await this.getCount('sections', 'deleted_at IS NULL');
    const groupCount = await this.getCount('groups', 'deleted_at IS NULL');
    const certCount = await this.getCount('opportunities', 'state = \'published\' OR state = \'open\'');

    const sectionRows = await this.dataSource.query(`
      SELECT s.id, s.code,
        b.name AS branch_name
      FROM sections s
      LEFT JOIN branches b ON b.id = s.branch_id
      WHERE s.deleted_at IS NULL
      ORDER BY s.created_at
    `);

    const sections = await Promise.all(
      sectionRows.map(async (s: any) => {
        const groups = await this.dataSource.query(`
          SELECT g.id, g.name,
            (SELECT COUNT(*) FROM enrollments e WHERE e.group_id = g.id AND e.is_active = true AND e.deleted_at IS NULL) AS student_count,
            (SELECT COUNT(*) FROM participations p JOIN enrollments e ON p.enrollment_id = e.id WHERE e.group_id = g.id AND (p.status = 'verified' OR p.status = 'completed')) AS completed_count,
            (SELECT COUNT(*) FROM participations p JOIN enrollments e ON p.enrollment_id = e.id WHERE e.group_id = g.id) AS total_participations
          FROM groups g
          WHERE g.section_id = $1 AND g.deleted_at IS NULL
          ORDER BY g.name
        `, [s.id]);

        const mappedGroups = groups.map((g: any) => ({
          id: g.id,
          name: g.name,
          studentCount: Number(g.student_count),
          completionPct: g.total_participations > 0
            ? Math.round((Number(g.completed_count) / Number(g.total_participations)) * 100)
            : 0,
        }));

        return {
          id: s.id,
          code: s.code,
          branchName: s.branch_name,
          groups: mappedGroups,
        };
      }),
    );

    const certRows = await this.dataSource.query(`
      SELECT o.id, o.title, o.opportunity_type,
        (SELECT COUNT(*) FROM participations p JOIN enrollments e ON p.enrollment_id = e.id WHERE p.opportunity_id = o.id) AS participating,
        (SELECT COUNT(*) FROM participations p JOIN enrollments e ON p.enrollment_id = e.id WHERE p.opportunity_id = o.id AND (p.status = 'verified' OR p.status = 'completed')) AS completed
      FROM opportunities o
      WHERE o.deleted_at IS NULL
      ORDER BY o.created_at
      LIMIT 6
    `);

    const certifications = certRows.map((c: any) => ({
      id: c.id,
      title: c.title,
      category: c.opportunity_type,
      participating: Number(c.participating),
      completionPct: c.participating > 0
        ? Math.round((Number(c.completed) / Number(c.participating)) * 100)
        : 0,
    }));

    const verifiedCount = await this.getCount('participations', "status = 'verified' OR status = 'completed'");

    const totalEnrollments = await this.getCount('enrollments', 'is_active = true AND deleted_at IS NULL');

    const placementReady = totalEnrollments > 0
      ? Math.round((verifiedCount / totalEnrollments) * 100)
      : 0;

    return {
      students: Number(studentCount),
      sectionCount: Number(sectionCount),
      groups: Number(groupCount),
      activeCertifications: Number(certCount),
      verifiedCertificates: Number(verifiedCount),
      placementReadiness: placementReady,
      sections,
      certifications,
    };
  }

  private async getCount(table: string, where: string): Promise<number> {
    const [row] = await this.dataSource.query(`SELECT COUNT(*) AS cnt FROM "${table}" WHERE ${where}`);
    return Number(row.cnt);
  }
}
