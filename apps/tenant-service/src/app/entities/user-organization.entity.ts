import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { OrganizationRole } from './organization-role.entity';
import { UserOrganizationRole } from '../organizations/constants/user-organization-role.enum';

@Entity('user_organizations')
@Unique(['userId', 'organizationId'])
export class UserOrganization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 36, name: 'organization_id' })
  organizationId: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    default: UserOrganizationRole.MEMBER,
  })
  role: UserOrganizationRole | null;

  @Column({ type: 'uuid', name: 'organization_role_id', nullable: true })
  organizationRoleId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.userOrganizations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, (org) => org.userOrganizations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => OrganizationRole, (role) => role.userOrganizations, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'organization_role_id' })
  organizationRole?: OrganizationRole | null;
}

