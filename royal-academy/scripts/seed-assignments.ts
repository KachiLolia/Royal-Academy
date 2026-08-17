import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding ClassSubjectTeacher assignments...');

  const classes = await prisma.class.findMany();
  const subjects = await prisma.subject.findMany();
  const teachers = await prisma.teacher.findMany();

  if (teachers.length === 0) {
    console.log('No teachers found in the database. Cannot seed assignments.');
    return;
  }

  if (classes.length === 0 || subjects.length === 0) {
    console.log('Missing classes or subjects.');
    return;
  }

  let count = 0;
  for (const c of classes) {
    // Assign 3 random subjects to each class
    const shuffledSubjects = [...subjects].sort(() => 0.5 - Math.random()).slice(0, 3);
    
    for (const s of shuffledSubjects) {
      const t = teachers[Math.floor(Math.random() * teachers.length)];
      
      try {
        await prisma.classSubjectTeacher.upsert({
          where: {
            classId_subjectId_teacherId: {
              classId: c.id,
              subjectId: s.id,
              teacherId: t.id
            }
          },
          create: {
            classId: c.id,
            subjectId: s.id,
            teacherId: t.id
          },
          update: {}
        });
        count++;
      } catch (e) {
        console.error('Error seeding assignment for', c.name, s.name);
      }
    }
  }

  console.log(`Successfully seeded ${count} ClassSubjectTeacher assignments!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
