import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // STUDENT, TEACHER, or PARENT

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 });
    }

    const status = searchParams.get('status');

    const whereClause: any = { role };
    if (status) {
      whereClause.status = status;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        studentProfile: {
          include: {
            class: true,
            section: true,
          }
        },
        teacherProfile: {
          include: {
            assignments: {
              include: {
                subject: true,
                class: true
              }
            }
          }
        },
        parentProfile: {
          include: {
            students: {
              include: {
                student: {
                  include: { user: true, class: true }
                }
              }
            }
          }
        },
      },
      orderBy: { lastName: 'asc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
