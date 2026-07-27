import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/schemas';
import { ZodError } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { hashPassword } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, validated.email),
    });

    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    }

    // Create user with customer role, inactive by default
    const passwordHash = await hashPassword(validated.password);
    const [user] = await db
      .insert(users)
      .values({
        name: validated.name,
        email: validated.email,
        passwordHash,
        role: 'customer',
        isActive: false,
      })
      .returning({ id: users.id, name: users.name, email: users.email });

    // Don't set cookie — user must wait for admin approval
    return NextResponse.json(
      {
        message: 'Registrasi berhasil. Menunggu persetujuan admin.',
        user: { id: user.id, name: user.name, email: user.email },
        pendingApproval: true,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
