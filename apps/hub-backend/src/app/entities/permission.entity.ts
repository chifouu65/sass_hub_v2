import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { OrganizationRolePermission } from './organization-role-permission.entity';

export enum PermissionCode {
  MANAGE_ORGANIZATION = 'manage_organization',
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_APPS = 'manage_apps',
  MANAGE_BILLING = 'manage_billing',
  VIEW_REPORTS = 'view_reports',
  VIEW_ONLY = 'view_only',
}

@Entity('permissions')
@Unique(['code'])
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  code: PermissionCode;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(
    () => OrganizationRolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: OrganizationRolePermission[];
}

