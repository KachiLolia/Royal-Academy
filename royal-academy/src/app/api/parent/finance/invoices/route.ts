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
    if (!payload || payload.role !== 'PARENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the parent record
    const parent = await prisma.parent.findUnique({
      where: { userId: payload.id as string },
      include: { students: true }
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent record not found' }, { status: 404 });
    }

    const studentIds = parent.students.map(ps => ps.studentId);

    // Fetch invoices for these students
    const invoices = await prisma.studentFee.findMany({
      where: {
        studentId: { in: studentIds }
      },
      include: {
        student: {
          include: { user: true, class: true }
        },
        feeStructure: {
          include: { term: true }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Fetch parent invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}
