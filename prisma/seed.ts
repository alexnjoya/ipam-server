import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user (or update password if exists)
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ipam.com' },
    update: {
      passwordHash: adminPassword,
      role: 'admin',
      username: 'admin',
    },
    create: {
      username: 'admin',
      email: 'admin@ipam.com',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });

  console.log('✅ Created/updated admin user:', admin.email);

  // Create sample subnet
  const subnet = await prisma.subnet.upsert({
    where: {
      networkAddress_subnetMask: {
        networkAddress: '192.168.1.0',
        subnetMask: 24,
      },
    },
    update: {},
    create: {
      networkAddress: '192.168.1.0',
      subnetMask: 24,
      cidr: '192.168.1.0/24',
      description: 'Main office network',
      location: 'Main Office',
      vlanId: 100,
    },
  });

  console.log('✅ Created sample subnet:', subnet.cidr);

  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

