import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Ensure only Admin or Teacher
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'SCHOOL_ADMIN' && payload.role !== 'TEACHER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const termId = searchParams.get('termId');

    if (!classId || !termId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch class with structure
    const currentClass = await prisma.class.findUnique({
      where: { id: classId }
    });

    // Fetch all students in this class
    const students = await prisma.student.findMany({
      where: { classId },
      include: { 
        user: true,
        section: true 
      }
    });

    // Fetch all grades for these students in this term
    const studentIds = students.map(s => s.id);
    const grades = await prisma.grade.findMany({
      where: {
        studentId: { in: studentIds },
        termId
      },
      include: {
        subject: true
      }
    });

    // Compute report cards
    const reportCards = students.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      
      let totalScore = 0;
      studentGrades.forEach(g => {
        totalScore += (g.totalScore || 0);
      });

      const average = studentGrades.length > 0 ? (totalScore / studentGrades.length) : 0;

      return {
        student,
        grades: studentGrades,
        totalScore,
        average,
        position: 0 // Will compute below
      };
    });

    // Sort by average descending to compute position
    reportCards.sort((a, b) => b.average - a.average);

    // Assign positions (handling ties)
    let currentPos = 1;
    let currentRank = 1;
    let prevAverage = -1;

    reportCards.forEach((report, index) => {
      if (report.average === prevAverage) {
        report.position = currentPos;
      } else {
        report.position = currentRank;
        currentPos = currentRank;
        prevAverage = report.average;
      }
      currentRank++;
    });

    // Re-sort alphabetically by first name for display
    reportCards.sort((a, b) => a.student.user.firstName.localeCompare(b.student.user.firstName));

    return NextResponse.json({
      className: currentClass?.name,
      reportCards
    });

  } catch (error) {
    console.error('Report Cards GET error:', error);
    return NextResponse.json({ error: 'Failed to generate report cards' }, { status: 500 });
  }
}
