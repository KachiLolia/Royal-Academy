import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to convert "HH:MM" to minutes for easy comparison
const toMins = (time: string) => {
  if (!time) return 0;
  const [h, m] = time.split(':');
  return parseInt(h) * 60 + parseInt(m);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const termId = searchParams.get('termId');
  const teacherId = searchParams.get('teacherId');

  try {
    const whereClause: any = {};
    if (classId) whereClause.classId = classId;
    if (termId) whereClause.termId = termId;
    if (teacherId) whereClause.teacherId = teacherId;

    const periods = await prisma.timetablePeriod.findMany({
      where: whereClause,
      include: {
        subject: true,
        teacher: { include: { user: true } },
        class: true,
        section: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json(periods);
  } catch (error) {
    console.error('Timetable GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classId, termId, periods } = body;

    if (!classId || !termId || !Array.isArray(periods)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Fetch existing teacher schedules for this term (excluding the current class)
    const teacherIds = [...new Set(periods.map((p: any) => p.teacherId))];
    const existingTeacherPeriods = await prisma.timetablePeriod.findMany({
      where: {
        termId,
        teacherId: { in: teacherIds },
        classId: { not: classId } // We exclude current class because we're about to replace its timetable
      },
      include: {
        class: true
      }
    });

    // 2. Validate for overlapping times
    for (const p of periods) {
      if (!p.startTime || !p.endTime || !p.dayOfWeek || !p.subjectId || !p.teacherId) {
        return NextResponse.json({ error: 'Incomplete period data provided' }, { status: 400 });
      }

      const pStart = toMins(p.startTime);
      const pEnd = toMins(p.endTime);

      if (pStart >= pEnd) {
        return NextResponse.json({ error: `Invalid time range: ${p.startTime} to ${p.endTime}` }, { status: 400 });
      }

      const conflicts = existingTeacherPeriods.filter(existing => 
        existing.teacherId === p.teacherId &&
        existing.dayOfWeek === p.dayOfWeek &&
        pStart < toMins(existing.endTime) && 
        pEnd > toMins(existing.startTime)
      );

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        return NextResponse.json(
          { error: `Conflict: Teacher is already booked for ${conflict.class.name} on Day ${p.dayOfWeek} from ${conflict.startTime} to ${conflict.endTime}` }, 
          { status: 400 }
        );
      }
    }

    // 3. Perform a transaction to wipe the old class timetable and insert the new one
    await prisma.$transaction(async (tx) => {
      await tx.timetablePeriod.deleteMany({
        where: { classId, termId }
      });

      if (periods.length > 0) {
        const dataToInsert = periods.map((p: any) => ({
          classId,
          termId,
          subjectId: p.subjectId,
          teacherId: p.teacherId,
          dayOfWeek: p.dayOfWeek,
          startTime: p.startTime,
          endTime: p.endTime
        }));

        await tx.timetablePeriod.createMany({
          data: dataToInsert
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Timetable saved successfully' });
  } catch (error: any) {
    console.error('Timetable POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
