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

    const { userIds } = await request.json();
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'No users provided' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        status: 'PENDING',
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
      }
    });

    const credentials = [];

    for (const user of users) {
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
          status: 'ACTIVE',
          mustChangePassword: false,
        }
      });

      await prisma.credentialDispatchLog.create({
        data: {
          userId: user.id,
          type: 'INITIAL',
          sentById: session.id,
        }
      });

      // Simulate sending email/SMS
      console.log(`[CREDENTIAL DISPATCH] Sent to ${user.firstName} ${user.lastName} (${user.role})`);
      console.log(`[CREDENTIAL DISPATCH] Username: ${username}`);
      console.log(`[CREDENTIAL DISPATCH] Temporary Password: ${tempPassword}`);
      console.log(`[CREDENTIAL DISPATCH] Instruction: You must change this password on first login.`);
      
      credentials.push({
        name: `${user.lastName}, ${user.firstName}`,
        username: username || '-',
        password: tempPassword,
        role: user.role
      });
    }

    return NextResponse.json({ success: true, count: users.length, credentials });
  } catch (error) {
    console.error('Activate users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
