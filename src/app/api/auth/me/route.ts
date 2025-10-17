/**
 * Get Current User API Route
 * 
 * Returns the current authenticated user's data from Firestore.
 */

import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/session';
import { getFirebaseAdmin } from '@/lib/firebase/firebase-admin';

export async function GET() {
  try {
    const decodedClaims = await getCurrentUserFromSession();

    if (!decodedClaims) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user data from Firestore
    const { db } = getFirebaseAdmin();
    const userDoc = await db.collection('users').doc(decodedClaims.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = {
      id: userDoc.id,
      ...userDoc.data(),
    };

    return NextResponse.json(userData);
  } catch (error: any) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user data' },
      { status: 500 }
    );
  }
}
