import bcrypt from "bcryptjs";

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 10);

  const users = [
    { email: "admin@timurforms.local", name: "Admin User", role: Role.ADMIN },
    { email: "user1@timurforms.local", name: "Demo User One", role: Role.USER },
    { email: "user2@timurforms.local", name: "Demo User Two", role: Role.USER },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        passwordHash,
      },
      create: {
        email: user.email,
        name: user.name,
        role: user.role,
        passwordHash,
      },
    });
  }

  console.log("Seed complete. Shared password: ChangeMe123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
