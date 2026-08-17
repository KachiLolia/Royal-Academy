import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';

function generateRandomPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'No user provided' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        teacherProfile: true,
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'User is not active' }, { status: 400 });
    }

    // Determine username
    let username = user.email;
    if (!username) {
      if (user.role === 'STUDENT' && user.studentProfile) {
        username = user.studentProfile.admissionNumber;
      } else if (user.role === 'TEACHER' && user.teacherProfile) {
        username = user.teacherProfile.staffId;
      } else {
        username = user.phone; // Fallback to phone
      }
    }

    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      }
    });

    await prisma.credentialDispatchLog.create({
      data: {
        userId: user.id,
        type: 'RESEND',
        sentById: session.id,
      }
    });

    // Simulate sending email/SMS
    console.log(`[CREDENTIAL DISPATCH (RESEND)] Sent to ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`[CREDENTIAL DISPATCH (RESEND)] Username: ${username}`);
    console.log(`[CREDENTIAL DISPATCH (RESEND)] New Temporary Password: ${tempPassword}`);
    console.log(`[CREDENTIAL DISPATCH (RESEND)] Instruction: You must change this password on next login.`);

    return NextResponse.json({ 
      success: true, 
      credentials: {
        name: `${user.lastName}, ${user.firstName}`,
        username: username || '-',
        password: tempPassword,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Resend credentials error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
