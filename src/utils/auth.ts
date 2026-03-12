import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function verifyKey(request: string) {
  if (request === process.env.API_KEY) {
    const name = process.env.SEED_USER_NAME;
    const apiUser = await prisma.user.findUniqueOrThrow({
      where: {
        name
      },
    });

    return apiUser;
  } else {
    throw new Error('401')
  }
}
