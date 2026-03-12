import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { encryptToken } from '../src/utils/crypto';
import { Octokit } from '@octokit/rest';
import {getUserGithubToken} from "./../src/utils/github.com"

const prisma = new PrismaClient();

async function seedUser() {
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
    where: { name: userData.name },
    update: {
      email: userData.email,
      name: userData.name,
      avatarUrl: userData.avatarUrl,
      githubToken: userData.githubToken,
    },
    create: userData,
  });

  console.log('Seeded user:', { id: user.id, username: user.username, email: user.email });
  return user;
}

async function seedProjectForUser(user: any) {
  const projectName = process.env.SEED_PROJECT_NAME || `${user.username}-project`;
  const existingProject = await prisma.project.findFirst({
    where: { name: projectName, userId: user.id }
  });

  if (!existingProject) {
    const seedToken = await getUserGithubToken(user.id);

    // Try to create repository on GitHub if we have a token
    if (seedToken) {
      try {
        const octokit = new Octokit({ auth: seedToken });
        // Attempt to create repository for the authenticated user
        const repoResp = await octokit.rest.repos.createForAuthenticatedUser({
          name: projectName,
          description: process.env.SEED_PROJECT_DESCRIPTION,
          private: process.env.SEED_PROJECT_PRIVATE === 'true',
          auto_init: true,
        });

        const repo = repoResp.data as any;

        const projectData = {
          name: repo.name,
          link: repo.html_url,
          description: repo.description,
          isPrivate: repo.private,
          metadata: {
            fullName: repo.full_name,
            defaultBranch: repo.default_branch,
            language: repo.language,
            createdAt: repo.created_at,
          },
          userId: user.id,
        } as any;

        const proj = await prisma.project.create({ data: projectData });
        console.log('Created GitHub repo and seeded project:', { id: proj.id, name: proj.name, link: proj.link });
        return proj;
      } catch (err: any) {
        console.error('GitHub repo creation failed, falling back to local project record. Error:', err.message || err);
        // If repo already exists or we can't create it, try to fetch it and use its data
        try {
          const octokit = new Octokit({ auth: seedToken });
          const owner = user.username;
          const repoResp = await octokit.rest.repos.get({ owner, repo: projectName });
          const repo = repoResp.data as any;
          const projectData = {
            name: repo.name,
            link: repo.html_url,
            description: repo.description,
            isPrivate: repo.private,
            metadata: {
              fullName: repo.full_name,
              defaultBranch: repo.default_branch,
              language: repo.language,
              createdAt: repo.created_at,
            },
            userId: user.id,
          } as any;

          const proj = await prisma.project.create({ data: projectData });
          console.log('Found existing GitHub repo and seeded project:', { id: proj.id, name: proj.name, link: proj.link });
          return proj;
        } catch (err2: any) {
          console.error('Failed to fetch existing GitHub repo:', err2.message || err2);
          // fall through to local-only creation below
        }
      }
    }

    // Fallback: create local project record without creating GitHub repo
    const projectData = {
      name: projectName,
      link: process.env.SEED_PROJECT_LINK || `https://github.com/${user.username}/${projectName}`,
      description: process.env.SEED_PROJECT_DESCRIPTION || 'Seed project created for development',
      isPrivate: process.env.SEED_PROJECT_PRIVATE === 'true',
      metadata: {
        fullName: `${user.username}/${projectName}`,
        defaultBranch: process.env.SEED_PROJECT_DEFAULT_BRANCH || 'main',
        language: process.env.SEED_PROJECT_LANGUAGE || 'TypeScript',
        createdAt: new Date().toISOString(),
      },
      userId: user.id,
    } as any;

    const proj = await prisma.project.create({ data: projectData });
    console.log('Seeded project (local-only):', { id: proj.id, name: proj.name, link: proj.link });
    return proj;
  } else {
    console.log('Project already exists for seed user:', { id: existingProject.id, name: existingProject.name });
    return existingProject;
  }
}

async function main() {
  const user = await seedUser();
  await seedProjectForUser(user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
