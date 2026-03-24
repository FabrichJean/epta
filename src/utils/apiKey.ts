import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate a secure API key
export function generateApiKey(): string {
  return 'epta_' + crypto.randomBytes(32).toString('hex');
}

// Hash an API key for storage
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Create preview of API key (first 8 chars + "...")
export function createApiKeyPreview(apiKey: string): string {
  return apiKey.substring(0, 12) + '...';
}

// Validate API key and return user info
export async function validateApiKey(apiKey: string): Promise<{ userId: number; user: any } | null> {
  try {
    const keyHash = hashApiKey(apiKey);
    
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        keyHash,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!apiKeyRecord) {
      return null;
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() }
    });

    return {
      userId: apiKeyRecord.userId,
      user: apiKeyRecord.user
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}

// Check if API key is expired or invalid
export async function cleanupExpiredApiKeys(): Promise<void> {
  try {
    await prisma.apiKey.updateMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        isActive: true
      },
      data: {
        isActive: false
      }
    });
  } catch (error) {
    console.error('Cleanup expired API keys error:', error);
  }
}