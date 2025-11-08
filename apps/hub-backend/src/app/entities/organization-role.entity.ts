import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { OrganizationRolePermission } from './organization-role-permission.entity';
import { UserOrganization } from './user-organization.entity';

@Entity('organization_roles')
@Index(['organizationId', 'slug'], { unique: true })
export class OrganizationRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 150 })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 36, name: 'organization_id', nullable: true })
  organizationId: string | null;

  @Column({ type: 'boolean', name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ type: 'boolean', name: 'is_default', default: false })
  isDefault: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Organization, (organization) => organization.roles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization | null;

  @OneToMany(
    () => OrganizationRolePermission,
    (rolePermission) => rolePermission.role,
  )
  permissions: OrganizationRolePermission[];

  @OneToMany(() => UserOrganization, (userOrg) => userOrg.organizationRole)
  userOrganizations: UserOrganization[];
}

