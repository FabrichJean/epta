import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
const prisma = new PrismaClient();

export async function extractProjectId(req: AuthRequest) {
  const projectId = req.params.projectId;

  if (req.user?.isApi === true) {
    const projectSeed = await prisma.project.findFirstOrThrow({
      where: {
        name: process.env.SEED_PROJECT_NAME,
      },
    });

    return projectSeed.id;
  }

  return parseInt(projectId)
}
