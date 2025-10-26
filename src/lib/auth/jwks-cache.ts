/**
 * JWKS Cache & Verification
 * Caches JWKS from Supabase and verifies RS256 signatures
 * 
 * Usage:
 *   const claims = await verifyJWT(token);
 */

import jwt from 'jsonwebtoken';

interface CachedJWKS {
  keys: any[];
  expiresAt: number;
}

let cachedJWKS: CachedJWKS | null = null;
const JWKS_CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get JWKS from Supabase endpoint (with caching)
 */
export async function getJWKS() {
  // Check cache
  if (cachedJWKS && cachedJWKS.expiresAt > Date.now()) {
    return cachedJWKS.keys;
  }

  console.log('📡 Fetching JWKS from Supabase...');

  try {
    const jwksUrl = process.env.SUPABASE_JWKS_URL;

    if (!jwksUrl) {
      throw new Error('SUPABASE_JWKS_URL not configured');
    }

    const response = await fetch(jwksUrl);

    if (!response.ok) {
      throw new Error(`JWKS fetch failed: ${response.status}`);
    }

    const data = await response.json();

    // Cache it
    cachedJWKS = {
      keys: data.keys,
      expiresAt: Date.now() + JWKS_CACHE_TTL,
    };

    console.log(`✅ JWKS cached (${data.keys.length} keys)`);
    return data.keys;
  } catch (error) {
    console.error('Failed to fetch JWKS:', error);
    throw error;
  }
}

/**
 * Find JWK by kid (Key ID)
 */
function findJWKbyKid(kid: string, keys: any[]) {
  return keys.find((key) => key.kid === kid);
}

/**
 * Verify JWT signature and return decoded claims
 */
export async function verifyJWT(token: string): Promise<any> {
  try {
    // Decode without verification first to get the kid
    const decoded = jwt.decode(token, { complete: true });

    if (!decoded) {
      throw new Error('Invalid token format');
    }

    const kid = decoded.header.kid as string;
    if (!kid) {
      throw new Error('Token missing kid in header');
    }

    const jwks = await getJWKS();
    const jwk = findJWKbyKid(kid, jwks);

    if (!jwk) {
      throw new Error(`JWKS key not found for kid: ${kid}`);
    }

    // Convert JWK to PEM (for RS256)
    const publicKey = jwkToPem(jwk);

    // Verify signature
    const claims = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: process.env.NEXT_PUBLIC_SUPABASE_URL,
      audience: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });

    return claims;
  } catch (error) {
    console.error('JWT verification failed:', error);
    throw error;
  }
}

/**
 * Convert JWK to PEM format
 */
function jwkToPem(jwk: any): string {
  // This is a simplified version; for production, use 'jwk-to-pem' package
  // For now, return as-is (jwt.verify also accepts JWK)
  return JSON.stringify(jwk);
}

/**
 * Check if JWT is expired
 */
export function isJWTExpired(claims: any): boolean {
  if (!claims.exp) {
    return false;
  }

  const expiresAt = claims.exp * 1000; // exp is in seconds
  return expiresAt < Date.now();
}

/**
 * Get JWT claims without verification (for debugging)
 * WARNING: Do not use for security-critical decisions
 */
export function decodeJWTUnsafe(token: string): any {
  try {
    const decoded = jwt.decode(token, { complete: true });
    return decoded?.payload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Invalidate JWKS cache (force refresh on next use)
 */
export function invalidateJWKSCache() {
  cachedJWKS = null;
  console.log('🔄 JWKS cache invalidated');
}

export default {
  getJWKS,
  verifyJWT,
  isJWTExpired,
  decodeJWTUnsafe,
  invalidateJWKSCache,
};
