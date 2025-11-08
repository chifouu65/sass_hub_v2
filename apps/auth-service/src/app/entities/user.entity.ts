import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_hash' })
  passwordHash!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
  lastName!: string | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'reset_password_token' })
  resetPasswordToken!: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'reset_password_expires' })
  resetPasswordExpires!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'oauth_provider' })
  oauthProvider!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'oauth_provider_id' })
  oauthProviderId!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatarUrl!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

