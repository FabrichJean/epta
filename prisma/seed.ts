import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { encryptToken } from '../src/utils/crypto';

const prisma = new PrismaClient();

async function main() {
  const seedGithubToken = process.env.SEED_GITHUB_TOKEN || 'ghp_example_token_for_seed_only';
  const encrypted = encryptToken(seedGithubToken);

  const userData = {
    email: process.env.SEED_USER_EMAIL || 'seed@local.test',
    name: process.env.SEED_USER_NAME || 'Seed User',
    username: process.env.SEED_USER_USERNAME || 'seed-user',
    avatarUrl: process.env.SEED_USER_AVATAR || 'https://avatars.githubusercontent.com/u/583231?v=4',
    githubToken: encrypted,
  };

  // Upsert user by unique username
  const user = await prisma.user.upsert({
    where: { username: userData.username },
    update: {
      email: userData.email,
      name: userData.name,
      avatarUrl: userData.avatarUrl,
      githubToken: userData.githubToken,
    },
    create: userData,
  });

  console.log('Seeded user:', { id: user.id, username: user.username, email: user.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
