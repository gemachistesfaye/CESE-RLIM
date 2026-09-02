import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring all users have a Researcher profile...');
  const users = await prisma.user.findMany({
    include: { researcher: true }
  });

  for (const user of users) {
    if (!user.researcher) {
      console.log(`Creating Researcher profile for user: ${user.email}`);
      await prisma.researcher.create({
        data: {
          userId: user.id,
          employeeOrStudentId: `EMP-${Math.floor(Math.random() * 10000)}`,
          department: 'Computer Science',
          academicPosition: 'Professor',
          expertise: 'AI and Software Engineering'
        }
      });
    }
  }
  console.log('Done!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
