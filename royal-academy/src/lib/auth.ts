import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-royal-academy-key-for-dev';
const key = new TextEncoder().encode(SECRET_KEY);

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token: string): Promise<{ id: string; role: string; [key: string]: any } | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      clockTolerance: 300 // 5 minutes tolerance for clock skew between Edge and Node environments
    });
    return payload as { id: string; role: string; [key: string]: any };
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return null;
  }
}

export async function getSession(): Promise<{ id: string; role: string; [key: string]: any } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}
