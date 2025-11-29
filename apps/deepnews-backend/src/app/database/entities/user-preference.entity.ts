import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryColumn()
  userId: string; // ID venant du système d'Auth (Hub)

  @Column('simple-array')
  likedTags: string[]; // ex: ['tech', 'finance', 'btc']

  @UpdateDateColumn()
  updatedAt: Date;
}

