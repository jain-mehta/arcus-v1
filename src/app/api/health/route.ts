/**
 * GET /api/health
 * 
 * Health check endpoint (public, no auth required)
 * Returns system status
 */

import { NextRequest } from 'next/server';
import { healthCheckHandler } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  return healthCheckHandler();
}

