import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  try {
    // Clean existing data
    await prisma.user.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        fullName: 'Admin User',
        username: 'admin',
        password: adminPassword,
        email: 'admin@agricoventas.com',
        role: 'admin',
      },
    });

    // Create a regular user
    const userPassword = await bcrypt.hash('user123', 10);
    const user = await prisma.user.create({
      data: {
        fullName: 'Regular User',
        username: 'user',
        password: userPassword,
        email: 'user@agricoventas.com',
        role: 'user',
      },
    });

    console.log('Database seeded successfully');
    console.log('Admin user created:', admin.username);
    console.log('Regular user created:', user.username);
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
