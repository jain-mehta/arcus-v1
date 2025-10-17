import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity({ name: 'tenant_metadata' })
export class TenantMetadata {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'text' })
  org_slug!: string;

  @Column({ type: 'text' })
  db_connection_string!: string; // for per-org DB

  @Column({ type: 'jsonb', default: () => "'{}'" })
  plan!: any; // billing / quota info
}
