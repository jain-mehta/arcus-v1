import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'text' })
  user_id!: string; // supabase user id

  @Column({ type: 'timestamp with time zone' })
  issued_at!: Date;

  @Column({ type: 'timestamp with time zone' })
  expires_at!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revoked_at!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  device_info!: any;
}
