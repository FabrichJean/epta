import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function verifyKey(request: string) {
  if (request === process.env.API_KEY) {
    const apiEmail = process.env.SEED_USER_EMAIL;
    const apiUser = await prisma.user.findUniqueOrThrow({
      where: {
        email: apiEmail,
      },
    });

    return apiUser;
  } else {
    throw new Error('401')
  }
}
