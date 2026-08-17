import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const termId = searchParams.get('termId');
    const classId = searchParams.get('classId');

    const where: any = {};
    if (termId) where.feeStructure = { termId };
    if (classId) where.student = { classId };

    const invoices = await prisma.studentFee.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            class: true,
          }
        },
        feeStructure: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Fetch invoices error:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Generate invoices for a selected class and term
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'SCHOOL_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { termId, classId } = await request.json();
    if (!termId || !classId) {
      return NextResponse.json({ error: 'Missing termId or classId' }, { status: 400 });
    }

    // Find all active students in the class
    const students = await prisma.student.findMany({
      where: { classId }
    });

    // Find all applicable fees (global or specific to this class) for the term
    const fees = await prisma.feeStructure.findMany({
      where: {
        termId,
        OR: [
          { classId: null },
          { classId: classId }
        ]
      }
    });

    if (fees.length === 0) {
      return NextResponse.json({ error: 'No fee structures found for this term and class' }, { status: 400 });
    }

    let createdCount = 0;

    for (const student of students) {
      for (const fee of fees) {
        // Upsert to prevent duplicate invoices for the same fee structure
        const existing = await prisma.studentFee.findUnique({
          where: {
            studentId_feeStructureId: {
              studentId: student.id,
              feeStructureId: fee.id,
            }
          }
        });

        if (!existing) {
          await prisma.studentFee.create({
            data: {
              studentId: student.id,
              feeStructureId: fee.id,
              amountDue: fee.amount,
            }
          });
          createdCount++;
        }
      }
    }

    return NextResponse.json({ success: true, count: createdCount }, { status: 201 });
  } catch (error) {
    console.error('Generate invoices error:', error);
    return NextResponse.json({ error: 'Failed to generate invoices' }, { status: 500 });
  }
}
