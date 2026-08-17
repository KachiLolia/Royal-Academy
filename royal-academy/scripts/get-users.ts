import { prisma } from '../src/lib/prisma';

async function main() {
  const teacher = await prisma.user.findFirst({where: {role: 'TEACHER'}});
  const student = await prisma.user.findFirst({where: {role: 'STUDENT'}});
  const parent = await prisma.user.findFirst({where: {role: 'PARENT'}});
  
  console.log('Teacher Email:', teacher?.email);
  console.log('Student Email:', student?.email);
  console.log('Parent Email:', parent?.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
