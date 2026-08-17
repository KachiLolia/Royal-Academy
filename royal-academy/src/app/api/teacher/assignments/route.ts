import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      include: { teacherProfile: true }
    });

    if (!user || !user.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const assignments = await prisma.classSubjectTeacher.findMany({
      where: { teacherId: user.teacherProfile.id },
      include: { class: true, subject: true }
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Assignments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
