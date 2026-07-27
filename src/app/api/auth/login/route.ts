import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    });

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // Verify password
    const valid = await verifyPassword(validated.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ error: 'Akun belum disetujui admin' }, { status: 403 });
    }

    // Generate token
    const token = await generateToken(user.id);

    // Set cookie
    const response = NextResponse.json({
      message: 'Login berhasil',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    const cookieHeader = setAuthCookie(token);
    response.headers.set('Set-Cookie', cookieHeader['Set-Cookie']);

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
