import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  try {
    // Clean existing data
    await prisma.user.deleteMany({});

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);

    const newUser = await prisma.user.create({
      data: {
        fullName: 'Admin User',
        username: 'admin',
        password: hashedPassword,
        email: 'admin@agricoventas.com',
      },
    });

    console.log('Database seeded successfully', newUser);
  } catch (error) {
    console.error('Error in seed function:', error);
  }
}

seed()
  .catch((error) => {
    console.error('Error seeding database:', error);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
