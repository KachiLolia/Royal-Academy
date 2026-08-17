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
    const dateStr = searchParams.get('date');
    const classId = searchParams.get('classId'); // Just to fetch students if no attendance exists

    if (!subjectId || !dateStr || !classId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const date = new Date(dateStr);

    // Fetch existing attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        subjectId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      }
    });

    // Fetch all students in the class so we can show them even if they don't have an attendance record yet
    const students = await prisma.student.findMany({
      where: { classId },
      include: { user: true },
      orderBy: { user: { firstName: 'asc' } }
    });

    // Merge students with attendance
    const merged = students.map(student => {
      const record = attendanceRecords.find(a => a.studentId === student.id);
      return {
        student,
        status: record ? record.status : 'PRESENT', // default to PRESENT if marking for first time
        remarks: record ? record.remarks : ''
      };
    });

    return NextResponse.json(merged);
  } catch (error) {
    console.error('Attendance GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { subjectId, termId, date: dateStr, records } = body;

    if (!subjectId || !termId || !dateStr || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const date = new Date(dateStr);
    date.setHours(12, 0, 0, 0); // Normalize to noon to avoid timezone shift issues

    await prisma.$transaction(
      records.map((record: any) => 
        prisma.attendance.upsert({
          where: {
            studentId_subjectId_date: {
              studentId: record.studentId,
              subjectId,
              date
            }
          },
          update: {
            status: record.status,
            remarks: record.remarks || undefined
          },
          create: {
            studentId: record.studentId,
            subjectId,
            termId,
            date,
            status: record.status,
            remarks: record.remarks || undefined
          }
        })
      )
    );

    return NextResponse.json({ success: true, message: 'Attendance saved successfully' });
  } catch (error: any) {
    console.error('Attendance POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
