import { User, PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/passwordUtils';
import { RegisterUserDto, SafeUser, userToSafeUser, UpdateUserInput, mapRegisterDtoToPrisma } from '../types/zod';

// Initialize Prisma client (this replaces the import from ../prisma)
const prisma = new PrismaClient();

/**
 * User service - handles all user-related operations
 */
export class UserService {
  /**
   * Find user by ID
   * @param id - User ID
   * @returns User if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by username
   * @param username - Username
   * @returns User if found, null otherwise
   */
  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  /**
   * Find user by email
   * @param email - Email
   * @returns User if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Get all users
   * @returns Array of users
   */
  async findAll(): Promise<SafeUser[]> {
    const users = await prisma.user.findMany();
    return users.map(userToSafeUser);
  }

  /**
   * Create a new user
   * @param userData - User data
   * @returns Created user
   */
  async create(userData: RegisterUserDto): Promise<User> {
    const { password, ...rest } = userData;
    const hashedPassword = await hashPassword(password);

    return prisma.user.create({
      data: {
        ...mapRegisterDtoToPrisma(userData),
        password: hashedPassword,
      },
    });
  }

  /**
   * Update a user
   * @param id - User ID
   * @param userData - Updates for the user
   * @returns Updated user
   */
  async update(id: string, userData: UpdateUserInput): Promise<User> {
    const updateData: any = { ...userData };

    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a user
   * @param id - User ID
   * @returns Deleted user
   */
  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Save refresh token for a user
   * @param userId - User ID
   * @param refreshToken - Refresh token
   * @returns Updated user
   */
  async saveRefreshToken(userId: string, refreshToken: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  /**
   * Remove refresh token from a user
   * @param userId - User ID
   * @returns Updated user
   */
  async removeRefreshToken(userId: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
