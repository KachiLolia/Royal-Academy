import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userIds } = await request.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No users provided' }, { status: 400 });
    }

    // Only allow discarding PENDING users
    await prisma.user.deleteMany({
      where: {
        id: { in: userIds },
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Discard users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
