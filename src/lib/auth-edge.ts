import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'scrmng-super-secret-key-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

export async function verifyToken(token: string): Promise<{ userId: number } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.userId as number };
  } catch {
    return null;
  }
}
