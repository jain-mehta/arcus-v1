import 'reflect-metadata';
import { NextRequest, NextResponse } from 'next/server';
import type { NextFetchEvent } from 'next/server';
import jwksRsa from 'jwks-rsa';
import jwt from 'jsonwebtoken';
import { getControlRepo } from './controlDataSource';
import { Session } from './entities/control/Session';
import { evaluatePolicy } from './policyAdapter';

const JWKS_URI = process.env.SUPABASE_JWKS || '';

const jwksClient = jwksRsa({ jwksUri: JWKS_URI });

function getKey(header: any, callback: any) {
  jwksClient.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    if (!key) return callback(new Error('No JWKS key found'));
    const anyKey: any = key;
    const signingKey = (typeof anyKey.getPublicKey === 'function') ? anyKey.getPublicKey() : (anyKey.publicKey || anyKey.rsaPublicKey);
    callback(null, signingKey);
  });
}

export async function authMiddleware(req: NextRequest, ev?: NextFetchEvent) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });

    // Check session revocation via control-plane
    if (!decoded.jti) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const repo = await getControlRepo(Session);
    const found = await repo.findOne({ where: { id: decoded.jti } });
    if (!found) return new NextResponse('Session not found', { status: 401 });
    if (found.revoked_at) return new NextResponse('Session revoked', { status: 401 });

    // Policy check - example action/resource
    const allow = await evaluatePolicy({
      principal: decoded.sub,
      action: req.method,
      resource: req.nextUrl.pathname,
      context: { org: decoded['org'] || null },
    });

    if (!allow) return new NextResponse('Forbidden', { status: 403 });

    // Append user claims for downstream handlers
    const res = NextResponse.next();
    res.headers.set('x-auth-user', decoded.sub);
    return res;
  } catch (err) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}

export default authMiddleware;

