import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Optionally handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
