import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function sanitizeUnique(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed === '-' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'null' || trimmed === '') {
    return undefined;
  }
  return trimmed;
}

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    let count = 0;
    const batchId = new Date().toISOString();

    if (type === 'students') {
      for (const row of data) {
        const admissionNumber = sanitizeUnique(row.admissionNumber);
        if (!admissionNumber || !row.firstName || !row.lastName) continue;

        let student = await prisma.student.findUnique({ where: { admissionNumber } });
        let user;
        
        const hashedPassword = await bcrypt.hash('password123', 10);
        const email = sanitizeUnique(row.email) || `student_${admissionNumber}@royalacademy.com`;
        const phone = sanitizeUnique(row.phone);

        let finalPhone = phone;
        if (finalPhone) {
          const existing = await prisma.user.findUnique({ where: { phone: finalPhone } });
          if (existing && (!student || existing.id !== student.userId)) {
            finalPhone = undefined;
          }
        }

        let finalEmail = row.email?.trim();
        if (finalEmail) {
          const existing = await prisma.user.findUnique({ where: { email: finalEmail } });
          if (existing && (!student || existing.id !== student.userId)) {
            finalEmail = undefined;
          }
        }

        if (student) {
          user = await prisma.user.update({
            where: { id: student.userId },
            data: {
              firstName: row.firstName,
              lastName: row.lastName,
              phone: finalPhone,
              ...(finalEmail ? { email: finalEmail } : {})
            }
          });
        } else {
          user = await prisma.user.upsert({
            where: { email },
            update: {
              firstName: row.firstName,
              lastName: row.lastName,
              phone: finalPhone,
            },
            create: {
              email,
              phone: finalPhone,
              firstName: row.firstName,
              lastName: row.lastName,
              role: 'STUDENT',
              status: 'PENDING',
              batchId,
            }
          });
        }

        let classId = undefined;
        let sectionId = undefined;

        if (row.className) {
          const cls = await prisma.class.upsert({
            where: { name: row.className },
            update: {},
            create: { name: row.className }
          });
          classId = cls.id;

          if (row.sectionName) {
            const sec = await prisma.section.upsert({
              where: { name_classId: { name: row.sectionName, classId: cls.id } },
              update: {},
              create: { name: row.sectionName, classId: cls.id }
            });
            sectionId = sec.id;
          }
        }

        // Upsert Student Profile
        await prisma.student.upsert({
          where: { userId: user.id },
          update: {
            admissionNumber,
            classId,
            sectionId
          },
          create: {
            userId: user.id,
            admissionNumber,
            classId,
            sectionId
          }
        });
        count++;
      }
    } else if (type === 'teachers') {
      for (const row of data) {
        const staffId = sanitizeUnique(row.staffId);
        if (!staffId || !row.firstName || !row.lastName) continue;

        const hashedPassword = await bcrypt.hash('password123', 10);
        const email = sanitizeUnique(row.email) || `teacher_${staffId}@royalacademy.com`;
        const phone = sanitizeUnique(row.phone);

        let teacher = await prisma.teacher.findUnique({ where: { staffId } });
        let user;

        let finalPhone = phone;
        if (finalPhone) {
          const existing = await prisma.user.findUnique({ where: { phone: finalPhone } });
          if (existing && (!teacher || existing.id !== teacher.userId)) {
            finalPhone = undefined; // Drop conflicting phone number
          }
        }

        let finalEmail = row.email?.trim();
        if (finalEmail) {
          const existing = await prisma.user.findUnique({ where: { email: finalEmail } });
          if (existing && (!teacher || existing.id !== teacher.userId)) {
            finalEmail = undefined;
          }
        }

        if (teacher) {
          user = await prisma.user.update({
            where: { id: teacher.userId },
            data: {
              firstName: row.firstName,
              lastName: row.lastName,
              phone: finalPhone,
              ...(finalEmail ? { email: finalEmail } : {})
            }
          });
        } else {
          user = await prisma.user.upsert({
            where: { email },
            update: { firstName: row.firstName, lastName: row.lastName, phone: finalPhone },
            create: {
              email,
              phone: finalPhone,
              firstName: row.firstName,
              lastName: row.lastName,
              role: 'TEACHER',
              status: 'PENDING',
              batchId,
            }
          });
          teacher = await prisma.teacher.create({
            data: { userId: user.id, staffId }
          });
        }

        // We don't need teacher upsert here anymore because we handled it above


        let classId = undefined;
        if (row.className) {
          const cls = await prisma.class.upsert({
            where: { name: row.className },
            update: {},
            create: { name: row.className }
          });
          classId = cls.id;
        }

        let subjectId = undefined;
        if (row.subjectName) {
          const subjectCode = row.subjectName.toUpperCase().replace(/\s+/g, '-');
          const sub = await prisma.subject.upsert({
            where: { code: subjectCode },
            update: { name: row.subjectName },
            create: { name: row.subjectName, code: subjectCode }
          });
          subjectId = sub.id;
        }

        if (classId && subjectId) {
          await prisma.classSubjectTeacher.upsert({
            where: { classId_subjectId_teacherId: { classId, subjectId, teacherId: teacher.id } },
            update: {},
            create: { classId, subjectId, teacherId: teacher.id }
          });
        }
        count++;
      }
    } else if (type === 'parents') {
      for (const row of data) {
        const phone = sanitizeUnique(row.phone);
        if (!phone || !row.firstName || !row.lastName) continue;

        const hashedPassword = await bcrypt.hash('password123', 10);
        const email = sanitizeUnique(row.email);
        
        const user = await prisma.user.upsert({
          where: { phone },
          update: { 
            firstName: row.firstName, 
            lastName: row.lastName,
            email
          },
          create: {
            phone,
            email,
            firstName: row.firstName,
            lastName: row.lastName,
            role: 'PARENT',
            status: 'PENDING',
            batchId,
          }
        });

        await prisma.parent.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id }
        });
        count++;
      }
    } else if (type === 'relationships') {
      for (const row of data) {
        if ((!row.parentPhone && !row.parentEmail) || !row.studentAdmissionNumber || !row.relationship) {
          continue;
        }
        
        let parentUser = null;
        if (row.parentPhone) {
          parentUser = await prisma.user.findUnique({
            where: { phone: row.parentPhone },
            include: { parentProfile: true }
          });
        }
        
        if (!parentUser && row.parentEmail) {
          parentUser = await prisma.user.findUnique({
            where: { email: row.parentEmail },
            include: { parentProfile: true }
          });
        }
        
        const student = await prisma.student.findUnique({
          where: { admissionNumber: row.studentAdmissionNumber }
        });

        if (parentUser?.parentProfile && student) {
          await prisma.parentStudent.upsert({
            where: {
              parentId_studentId: {
                parentId: parentUser.parentProfile.id,
                studentId: student.id
              }
            },
            update: { relationship: row.relationship },
            create: {
              parentId: parentUser.parentProfile.id,
              studentId: student.id,
              relationship: row.relationship
            }
          });
          count++;
        }
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error('Import error detail:', error);
    const errorMsg = error?.meta?.target ? `Unique constraint failed on ${error.meta.target}` : error.message || 'Internal server error';
    return NextResponse.json({ error: errorMsg, fullError: String(error) }, { status: 500 });
  }
}
