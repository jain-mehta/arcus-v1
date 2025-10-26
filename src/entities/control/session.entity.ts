import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  OneToMany,
} from 'typeorm';

/**
 * Session Entity - Control-plane table for JWT session revocation
 * Stores active sessions with jti (JWT ID) for revocation checks
 * One row per active login; delete to revoke session immediately
 */
@Entity('sessions')
@Index(['jti'], { unique: true })
@Index(['user_id', 'tenant_id'])
@Index(['expires_at'])
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  jti!: string; // JWT ID (unique session identifier from token)

  @Column({ type: 'uuid' })
  user_id!: string; // Reference to Supabase Auth user

  @Column({ type: 'uuid' })
  tenant_id!: string; // Which tenant this session belongs to

  @Column({ type: 'varchar', length: 100, nullable: true })
  role?: string; // User's role at time of login (snapshot)

  @Column({ type: 'text', nullable: true })
  ip_address?: string; // Client IP for security audit

  @Column({ type: 'text', nullable: true })
  user_agent?: string; // Browser/client info

  @CreateDateColumn()
  created_at!: Date; // When session was issued

  @Column({ type: 'timestamp', nullable: true })
  issued_at?: Date; // JWT iat claim

  @Column({ type: 'timestamp' })
  expires_at!: Date; // JWT exp claim; revoked if past this

  @Column({ type: 'boolean', default: false })
  revoked: boolean = false; // Manual revocation flag (logout/admin revoke)

  @Column({ type: 'text', nullable: true })
  revoke_reason?: string; // Why revoked (logout, admin revoke, expired, etc.)

  @UpdateDateColumn()
  updated_at!: Date;
}
