import { NextResponse } from 'next/server';
import { getCurrentUser, clearAuthCookie } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, {
      status: 401,
      headers: clearAuthCookie(),
    });
  }

  return NextResponse.json({ user });
}
