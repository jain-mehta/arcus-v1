/**
 * Authentication Service - PostgreSQL-based
 * Uses Supabase for Authentication
 * 
 * Features:
 * - Password hashing with bcrypt
 * - JWT token generation and validation
 * - Refresh token management
 * - Account lockout after failed attempts
 * - Audit logging
 */

import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { User, RefreshToken, AuditLog, Organization, Role } from './entities/auth.entity';
import { getControlRepo } from './controlDataSource';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m'; // 15 minutes for access token
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  organizationId?: string;
  roleId?: string;
  permissions?: Record<string, any>;
  iat?: number;
  exp?: number;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate access token (JWT)
 */
export function generateAccessToken(payload: JWTPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Generate refresh token (random string)
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData, organizationId?: string): Promise<User> {
  const userRepo = await getControlRepo(User);
  
  // Check if user already exists
  const existing = await userRepo.findOne({ where: { email: data.email } });
  if (existing) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const user = userRepo.create({
    email: data.email,
    passwordHash,
    fullName: data.fullName,
    phone: data.phone,
    isActive: true,
    isEmailVerified: false,
  });

  await userRepo.save(user);

  // Create audit log
  await createAuditLog({
    userId: user.id,
    organizationId,
    action: 'user.registered',
    resourceType: 'user',
    resourceId: user.id,
    details: { email: user.email, fullName: user.fullName },
  });

  return user;
}

/**
 * Login user and generate tokens
 */
export async function loginUser(
  credentials: LoginCredentials,
  deviceInfo?: Record<string, any>,
  ipAddress?: string
): Promise<{ user: User; tokens: AuthTokens; organization?: Organization; role?: Role }> {
  const userRepo = await getControlRepo(User);
  
  // Find user
  const user = await userRepo.findOne({ where: { email: credentials.email } });
  
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Account is locked. Please try again in ${minutesLeft} minutes.`);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new Error('Account is deactivated. Please contact support.');
  }

  // Verify password
  const isValidPassword = await verifyPassword(credentials.password, user.passwordHash);
  
  if (!isValidPassword) {
    // Increment failed attempts
    user.failedLoginAttempts += 1;

    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      await userRepo.save(user);
      throw new Error(`Account locked due to too many failed login attempts. Try again in 30 minutes.`);
    }

    await userRepo.save(user);
    throw new Error('Invalid email or password');
  }

  // Reset failed attempts on successful login
  user.failedLoginAttempts = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();
  await userRepo.save(user);

  // Get user's organization and role
  const userRoleRepo = await getControlRepo('user_roles');
  const userRole = await userRoleRepo.findOne({
    where: { userId: user.id },
    relations: ['organization', 'role'],
  });

  const organization = userRole?.organization;
  const role = userRole?.role;

  // Generate tokens
  const tokens = await generateAuthTokens(user, organization, role, deviceInfo, ipAddress);

  // Create audit log
  await createAuditLog({
    userId: user.id,
    organizationId: organization?.id,
    action: 'user.login',
    resourceType: 'user',
    resourceId: user.id,
    details: { deviceInfo, ipAddress },
    ipAddress,
  });

  return { user, tokens, organization, role };
}

/**
 * Generate access and refresh tokens
 */
async function generateAuthTokens(
  user: User,
  organization?: Organization,
  role?: Role,
  deviceInfo?: Record<string, any>,
  ipAddress?: string
): Promise<AuthTokens> {
  const refreshTokenRepo = await getControlRepo(RefreshToken);

  // Create access token payload
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    organizationId: organization?.id,
    roleId: role?.id,
    permissions: role?.permissions,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();

  // Hash refresh token before storing
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // Save refresh token to database
  const refreshTokenEntity = refreshTokenRepo.create({
    userId: user.id,
    tokenHash,
    deviceInfo,
    ipAddress,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN),
  });

  await refreshTokenRepo.save(refreshTokenEntity);

  return {
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const refreshTokenRepo = await getControlRepo(RefreshToken);
  const userRepo = await getControlRepo(User);

  // Hash the provided refresh token
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // Find refresh token in database
  const storedToken = await refreshTokenRepo.findOne({
    where: { tokenHash },
  });

  if (!storedToken) {
    throw new Error('Invalid refresh token');
  }

  // Check if token is expired
  if (storedToken.expiresAt < new Date()) {
    throw new Error('Refresh token expired');
  }

  // Check if token is revoked
  if (storedToken.revokedAt) {
    throw new Error('Refresh token has been revoked');
  }

  // Get user
  const user = await userRepo.findOne({ where: { id: storedToken.userId } });
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  // Get user's organization and role
  const userRoleRepo = await getControlRepo('user_roles');
  const userRole = await userRoleRepo.findOne({
    where: { userId: user.id },
    relations: ['organization', 'role'],
  });

  // Generate new access token
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    organizationId: userRole?.organization?.id,
    roleId: userRole?.role?.id,
    permissions: userRole?.role?.permissions,
  };

  const accessToken = generateAccessToken(payload);

  return {
    accessToken,
    expiresIn: 900, // 15 minutes
  };
}

/**
 * Logout user (revoke refresh token)
 */
export async function logoutUser(refreshToken: string): Promise<void> {
  const refreshTokenRepo = await getControlRepo(RefreshToken);

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const storedToken = await refreshTokenRepo.findOne({
    where: { tokenHash },
  });

  if (storedToken) {
    storedToken.revokedAt = new Date();
    await refreshTokenRepo.save(storedToken);

    // Create audit log
    await createAuditLog({
      userId: storedToken.userId,
      action: 'user.logout',
      resourceType: 'user',
      resourceId: storedToken.userId,
    });
  }
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  const refreshTokenRepo = await getControlRepo(RefreshToken);

  await refreshTokenRepo
    .createQueryBuilder()
    .update(RefreshToken)
    .set({ revokedAt: new Date() })
    .where('userId = :userId', { userId })
    .andWhere('revokedAt IS NULL')
    .execute();
}

/**
 * Create audit log entry
 */
export async function createAuditLog(data: {
  userId?: string;
  organizationId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    const auditLogRepo = await getControlRepo(AuditLog);
    
    const log = auditLogRepo.create(data);
    await auditLogRepo.save(log);
  } catch (error) {
    console.error('[Auth] Failed to create audit log:', error);
    // Don't throw - audit log failure shouldn't block operations
  }
}

/**
 * Get user by ID with organization and role
 */
export async function getUserById(userId: string): Promise<User | null> {
  const userRepo = await getControlRepo(User);
  
  const user = await userRepo.findOne({
    where: { id: userId },
  });

  return user;
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<Record<string, any>> {
  const userRoleRepo = await getControlRepo('user_roles');
  
  const userRole = await userRoleRepo.findOne({
    where: { userId },
    relations: ['role'],
  });

  return userRole?.role?.permissions || {};
}

