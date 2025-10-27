/**
 * Get Current User API Route
 * 
 * Returns the current authenticated user's data from Supabase.
 */

import { NextResponse } from 'next/server';
import { getCurrentUserFromSession } from '@/lib/session';
import { supabaseClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const session = await supabaseClient.auth.getSession();
    
    if (!session.data.session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const user = session.data.session.user;

    // Fetch user profile from Supabase
    const { data: userProfile, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      ...userProfile,
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user data' },
      { status: 500 }
    );
  }
}

