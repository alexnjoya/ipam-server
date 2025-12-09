import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function main() {
  console.log(' Seeding database...');

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

  // Create sample IPv4 subnet
  const existingSubnet = await prisma.subnet.findUnique({
    where: {
      networkAddress_subnetMask_ipVersion: {
        networkAddress: '192.168.1.0',
        subnetMask: 24,
        ipVersion: 'IPv4',
      },
    } as any,
  });

  const subnet = existingSubnet || await prisma.subnet.create({
    data: {
      networkAddress: '192.168.1.0',
      subnetMask: 24,
      ipVersion: 'IPv4',
      cidr: '192.168.1.0/24',
      description: 'Main office network',
      location: 'Main Office',
      vlanId: 100,
    } as any,
  });

  console.log('✅ Created/updated sample IPv4 subnet:', subnet.cidr);

  // Create sample IPv6 subnet
  const existingSubnet6 = await prisma.subnet.findUnique({
    where: {
      networkAddress_subnetMask_ipVersion: {
        networkAddress: '2001:db8::',
        subnetMask: 64,
        ipVersion: 'IPv6',
      },
    } as any,
  });

  const subnet6 = existingSubnet6 || await prisma.subnet.create({
    data: {
      networkAddress: '2001:db8::',
      subnetMask: 64,
      ipVersion: 'IPv6',
      cidr: '2001:db8::/64',
      description: 'Main office IPv6 network',
      location: 'Main Office',
      vlanId: 100,
    } as any,
  });

  console.log('✅ Created/updated sample IPv6 subnet:', subnet6.cidr);

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

