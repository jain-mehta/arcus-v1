import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'user_mappings' })
export class UserMapping {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  legacy_uid!: string; // firebase uid

  @Index({ unique: true })
  @Column({ type: 'text' })
  supabase_user_id!: string;

  @Column({ type: 'timestamp with time zone', default: () => 'now()' })
  created_at!: Date;
}
