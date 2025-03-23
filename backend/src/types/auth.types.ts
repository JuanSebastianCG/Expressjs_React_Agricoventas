import { User } from '@prisma/client';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterUserDto {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface SafeUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  user: SafeUser;
  tokens?: AuthTokens;
}

export const userToSafeUser = (user: User): SafeUser => {
  const { password, refreshToken, ...safeUser } = user;
  return safeUser as SafeUser;
};
