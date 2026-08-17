import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding terms...');

  // Create an active academic year
  let year = await prisma.academicYear.findFirst();
  if (!year) {
    year = await prisma.academicYear.create({
      data: {
        name: '2026/2027',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-07-31'),
        isActive: true,
      }
    });
    console.log('Created Academic Year:', year.name);
  }

  // Create terms for this year
  const terms = [
    { name: '1st Term', start: '2026-09-01', end: '2026-12-15' },
    { name: '2nd Term', start: '2027-01-10', end: '2027-04-10' },
    { name: '3rd Term', start: '2027-05-01', end: '2027-07-20' },
  ];

  for (let i = 0; i < terms.length; i++) {
    const t = terms[i];
    const existingTerm = await prisma.term.findFirst({
      where: { name: t.name, academicYearId: year.id }
    });

    if (!existingTerm) {
      await prisma.term.create({
        data: {
          name: t.name,
          startDate: new Date(t.start),
          endDate: new Date(t.end),
          isActive: i === 0, // make first term active
          academicYearId: year.id
        }
      });
      console.log('Created Term:', t.name);
    }
  }

  console.log('Terms seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
