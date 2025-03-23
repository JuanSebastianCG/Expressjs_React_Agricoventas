import { User } from '@prisma/client';
import { UserService } from './user.service';
import { verifyPassword } from '../utils/passwordUtils';
import {
  AuthTokens,
  JwtPayload,
  LoginCredentials,
  RegisterUserDto,
  SafeUser,
  UserResponse,
  userToSafeUser,
} from '../types/zod';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils';

/**
 * Authentication service
 */
export class AuthService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Register a new user
   * @param userData - User registration data
   * @returns User response with tokens
   */
  async register(userData: RegisterUserDto): Promise<UserResponse> {
    // Check if username already exists
    const existingUsername = await this.userService.findByUsername(userData.username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    const existingEmail = await this.userService.findByEmail(userData.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Create user
    const user = await this.userService.create(userData);

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      username: (user as any).username,
      role: user.role,
    };

    const tokens = generateTokens(payload);

    // Save refresh token to user
    await this.userService.saveRefreshToken(user.id, tokens.refreshToken);

    // Return safe user with tokens
    return {
      user: userToSafeUser(user),
      tokens,
    };
  }

  /**
   * Login a user
   * @param credentials - Login credentials
   * @returns User response with tokens
   */
  async login(credentials: LoginCredentials): Promise<UserResponse> {
    const { username, password } = credentials;

    // Find user by username
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!(user as any).isActive) {
      throw new Error('User account is disabled');
    }

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      username: (user as any).username,
      role: user.role,
    };

    const tokens = generateTokens(payload);

    // Save refresh token to user
    await this.userService.saveRefreshToken(user.id, tokens.refreshToken);

    // Return safe user with tokens
    return {
      user: userToSafeUser(user),
      tokens,
    };
  }

  /**
   * Logout a user
   * @param userId - User ID
   */
  async logout(userId: string): Promise<void> {
    // Remove refresh token from user
    await this.userService.removeRefreshToken(userId);
  }

  /**
   * Refresh tokens using a refresh token
   * @param refreshToken - Refresh token
   * @returns New tokens
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new Error('Invalid refresh token');
    }

    // Find user
    const user = await this.userService.findById(decoded.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if token matches stored token
    if ((user as any).refreshToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const payload: JwtPayload = {
      userId: user.id,
      username: (user as any).username,
      role: user.role,
    };

    const tokens = generateTokens(payload);

    // Save new refresh token
    await this.userService.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Get current user profile
   * @param userId - User ID
   * @returns Safe user
   */
  async getProfile(userId: string): Promise<SafeUser> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return userToSafeUser(user);
  }
}
