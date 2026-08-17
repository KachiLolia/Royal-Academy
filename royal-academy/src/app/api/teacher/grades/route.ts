import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const termId = searchParams.get('termId');
    const classId = searchParams.get('classId'); 

    if (!subjectId || !termId || !classId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch students
    const students = await prisma.student.findMany({
      where: { classId },
      include: { user: true },
      orderBy: { user: { firstName: 'asc' } }
    });

    // Fetch existing grades
    const grades = await prisma.grade.findMany({
      where: { subjectId, termId }
    });

    // Merge
    const merged = students.map(student => {
      const g = grades.find(g => g.studentId === student.id);
      return {
        student,
        attendanceScore: g?.attendanceScore || 0,
        assignmentScore: g?.assignmentScore || 0,
        caScore: g?.caScore || 0,
        examScore: g?.examScore || 0,
        totalScore: g?.totalScore || 0,
        grade: g?.grade || '',
        remarks: g?.remarks || ''
      };
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error('Grades GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { subjectId, termId, records } = body;

    if (!subjectId || !termId || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const calculateGradeLetter = (total: number) => {
      if (total >= 75) return 'A';
      if (total >= 65) return 'B';
      if (total >= 50) return 'C';
      if (total >= 40) return 'D';
      return 'F';
    };

    await prisma.$transaction(
      records.map((r: any) => {
        const att = parseFloat(r.attendanceScore) || 0;
        const ass = parseFloat(r.assignmentScore) || 0;
        const ca = parseFloat(r.caScore) || 0;
        const ex = parseFloat(r.examScore) || 0;
        const total = att + ass + ca + ex;
        const letter = calculateGradeLetter(total);

        return prisma.grade.upsert({
          where: {
            studentId_subjectId_termId: {
              studentId: r.studentId,
              subjectId,
              termId
            }
          },
          update: {
            attendanceScore: att,
            assignmentScore: ass,
            caScore: ca,
            examScore: ex,
            totalScore: total,
            grade: letter,
            remarks: r.remarks || undefined
          },
          create: {
            studentId: r.studentId,
            subjectId,
            termId,
            attendanceScore: att,
            assignmentScore: ass,
            caScore: ca,
            examScore: ex,
            totalScore: total,
            grade: letter,
            remarks: r.remarks || undefined
          }
        });
      })
    );

    return NextResponse.json({ success: true, message: 'Grades saved successfully' });
  } catch (error: any) {
    console.error('Grades POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
