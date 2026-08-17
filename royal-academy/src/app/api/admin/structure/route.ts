import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const academicYears = await prisma.academicYear.findMany({ include: { terms: true } });
    const classes = await prisma.class.findMany({ include: { sections: true, subjectAssignments: true } });
    const subjects = await prisma.subject.findMany();

    return NextResponse.json({ academicYears, classes, subjects });
  } catch (error) {
    console.error('Failed to fetch structure:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();

    if (type === 'academicYear') {
      const { name, startDate, endDate, isActive } = data;
      if (isActive) {
        await prisma.academicYear.updateMany({ data: { isActive: false } }); // Only one active year
      }
      const academicYear = await prisma.academicYear.create({
        data: { name, startDate: new Date(startDate), endDate: new Date(endDate), isActive }
      });
      return NextResponse.json({ success: true, data: academicYear });
    } 
    
    if (type === 'class') {
      const { name, sections } = data; // sections is an array of strings e.g. ["A", "B"]
      
      let classObj = await prisma.class.findUnique({ where: { name } });
      if (!classObj) {
        classObj = await prisma.class.create({
          data: { name }
        });
      }

      for (const secName of sections) {
        await prisma.section.upsert({
          where: {
            name_classId: {
              name: secName,
              classId: classObj.id
            }
          },
          update: {},
          create: {
            name: secName,
            classId: classObj.id
          }
        });
      }

      return NextResponse.json({ success: true, data: classObj });
    }

    if (type === 'subject') {
      const { name, code, description } = data;
      const subject = await prisma.subject.create({
        data: { name, code, description }
      });
      return NextResponse.json({ success: true, data: subject });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Failed to create structure entity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    if (type === 'academicYear') {
      await prisma.academicYear.delete({ where: { id } });
    } else if (type === 'class') {
      await prisma.class.delete({ where: { id } });
    } else if (type === 'subject') {
      await prisma.subject.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete structure entity:', error);
    return NextResponse.json({ error: 'Failed to delete (might be tied to existing records)' }, { status: 400 });
  }
}
