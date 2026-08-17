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

    const body = await request.json();
    const { role, firstName, lastName, email, phone, sendImmediately } = body;

    if (!role || !firstName || !lastName || (!email && !phone)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if email or phone already exists
    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) return NextResponse.json({ error: 'Phone already exists' }, { status: 400 });
    }

    const batchId = 'Manual entry';
    const status = sendImmediately ? 'ACTIVE' : 'PENDING';
    let tempPassword = null;
    let hashedPassword = null;

    if (sendImmediately) {
      tempPassword = generateRandomPassword();
      hashedPassword = await bcrypt.hash(tempPassword, 10);
    }

    const user = await prisma.user.create({
      data: {
        role,
        firstName,
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        status,
        batchId,
        mustChangePassword: false,
        password: hashedPassword,
      }
    });

    // Create role-specific profiles
    if (role === 'STUDENT') {
      const { admissionNumber, classId, sectionId } = body;
      if (!admissionNumber) {
        await prisma.user.delete({ where: { id: user.id } });
        return NextResponse.json({ error: 'Missing admission number for student' }, { status: 400 });
      }
      await prisma.student.create({
        data: {
          userId: user.id,
          admissionNumber,
          classId,
          sectionId,
        }
      });
    } else if (role === 'TEACHER') {
      const { staffId } = body;
      if (!staffId) {
        await prisma.user.delete({ where: { id: user.id } });
        return NextResponse.json({ error: 'Missing staff ID for teacher' }, { status: 400 });
      }
      await prisma.teacher.create({
        data: {
          userId: user.id,
          staffId,
        }
      });
    } else if (role === 'PARENT') {
      const parent = await prisma.parent.create({
        data: {
          userId: user.id,
        }
      });
      // Link students here if provided
      if (body.childrenIdentifiers && Array.isArray(body.childrenIdentifiers)) {
        for (const identifier of body.childrenIdentifiers) {
          // Find student by admissionNumber or email
          const student = await prisma.student.findFirst({
            where: {
              OR: [
                { admissionNumber: identifier },
                { user: { email: identifier } }
              ]
            }
          });

          if (student) {
            await prisma.parentStudent.create({
              data: {
                parentId: parent.id,
                studentId: student.id,
                relationship: 'Parent/Guardian'
              }
            });
          }
        }
      }
    }

    if (sendImmediately) {
      await prisma.credentialDispatchLog.create({
        data: {
          userId: user.id,
          type: 'INITIAL',
          sentById: session.id,
        }
      });

      let username = email || phone;
      if (role === 'STUDENT') username = body.admissionNumber;
      if (role === 'TEACHER') username = body.staffId;

      console.log(`[CREDENTIAL DISPATCH] Sent to ${user.firstName} ${user.lastName} (${user.role})`);
      console.log(`[CREDENTIAL DISPATCH] Username: ${username}`);
      console.log(`[CREDENTIAL DISPATCH] Temporary Password: ${tempPassword}`);
      console.log(`[CREDENTIAL DISPATCH] Instruction: You must change this password on first login.`);
      
      return NextResponse.json({ 
        success: true, 
        user,
        credentials: {
          name: `${user.lastName}, ${user.firstName}`,
          username: username || '-',
          password: tempPassword,
          role: user.role
        }
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Manual user creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
