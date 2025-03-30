import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TokenService {
  /**
   * Add a token to the blacklist
   * @param token - Token to blacklist
   * @param expiresAt - When the token expires
   */
  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    await prisma.blacklistedToken.create({
      data: {
        token,
        expiresAt,
      },
    });
  }

  /**
   * Check if a token is blacklisted
   * @param token - Token to check
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await prisma.blacklistedToken.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return !!blacklistedToken;
  }

  /**
   * Clean up expired blacklisted tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    await prisma.blacklistedToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
} 