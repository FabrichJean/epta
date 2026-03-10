import { PrismaClient } from '@prisma/client';
import { Octokit } from '@octokit/rest';
import { decryptToken } from '../utils/crypto';

const prisma = new PrismaClient();

// Helper function to get user's decrypted GitHub token
export async function getUserGithubToken(userId: number): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { githubToken: true }
  });
  
  if (!user?.githubToken) {
    return null;
  }
  
  try {

    return decryptToken(user.githubToken);
  } catch (error) {
    console.error('Error decrypting token:', error);
    return null;
  }
}