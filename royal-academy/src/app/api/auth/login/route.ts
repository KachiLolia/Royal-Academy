import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { identifier, password, isOtp } = await request.json();

    let user;

    if (isOtp) {
      // For Parents logging in with OTP
      if (password !== '123456') { // Mock OTP validation
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
      }
      user = await prisma.user.findUnique({
        where: { phone: identifier }
      });
    } else {
      // For Staff logging in with email/password
      user = await prisma.user.findUnique({
        where: { email: identifier }
      });

      if (!user || !user.password) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.status === 'PENDING') {
      return NextResponse.json({ error: 'Account not activated yet' }, { status: 403 });
    }

    if (user.status === 'SUSPENDED' || !user.isActive) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 403 });
    }

    const token = await signToken({
      id: user.id,
      role: user.role,
      email: user.email,
      mustChangePassword: user.mustChangePassword,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
