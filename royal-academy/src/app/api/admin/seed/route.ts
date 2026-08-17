import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'admin@royalacademy.com' },
      update: {},
      create: {
        email: 'admin@royalacademy.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      },
    });
    return NextResponse.json({ success: true, message: 'Seeded admin successfully', user });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to seed' }, { status: 500 });
  }
}
