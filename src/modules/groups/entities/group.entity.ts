import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/base/base.entity';
import { Section } from '../../sections/entities/section.entity';
import { User } from '../../users/entities/user.entity';

@Entity('groups')
export class Group extends BaseEntity {
  @Column({ name: 'section_id' })
  sectionId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ name: 'team_leader_user_id', type: 'varchar', nullable: true })
  teamLeaderUserId: string | null;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'section_id' })
  section: Section;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'team_leader_user_id' })
  teamLeader: User;
}
