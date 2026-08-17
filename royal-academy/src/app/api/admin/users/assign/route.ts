import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const { userId, role, classId, sectionId, assignments } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    if (role === 'STUDENT') {
      await prisma.student.update({
        where: { userId },
        data: { 
          classId: classId || null, 
          sectionId: sectionId || null 
        }
      });
      return NextResponse.json({ success: true });
    }

    if (role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId } });
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Clear existing assignments
      await prisma.classSubjectTeacher.deleteMany({
        where: { teacherId: teacher.id }
      });

      // Create new assignments if any
      if (assignments && Array.isArray(assignments) && assignments.length > 0) {
        await prisma.classSubjectTeacher.createMany({
          data: assignments.map((a: any) => ({
            teacherId: teacher.id,
            classId: a.classId,
            subjectId: a.subjectId
          }))
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
