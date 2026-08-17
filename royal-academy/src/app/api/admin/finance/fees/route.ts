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
    if (termId) where.termId = termId;
    if (classId) where.classId = classId;

    const fees = await prisma.feeStructure.findMany({
      where,
      include: {
        term: true,
        class: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(fees);
  } catch (error) {
    console.error('Fetch fees error:', error);
    return NextResponse.json({ error: 'Failed to fetch fee structures' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'SCHOOL_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, amount, termId, classId } = body;

    if (!name || !amount || !termId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const fee = await prisma.feeStructure.create({
      data: {
        name,
        description,
        amount: parseFloat(amount),
        termId,
        classId: classId || null,
      },
    });

    return NextResponse.json(fee, { status: 201 });
  } catch (error) {
    console.error('Create fee error:', error);
    return NextResponse.json({ error: 'Failed to create fee structure' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'SUPER_ADMIN' && payload.role !== 'SCHOOL_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing fee ID' }, { status: 400 });
    }

    await prisma.feeStructure.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete fee error:', error);
    return NextResponse.json({ error: 'Failed to delete fee structure' }, { status: 500 });
  }
}
