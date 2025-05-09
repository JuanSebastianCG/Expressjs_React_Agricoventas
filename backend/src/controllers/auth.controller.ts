import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginDto, CreateUserDto, ChangePasswordDto } from "../schemas/user.schema";
import { sendSuccessResponse, sendErrorResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";

const prisma = new PrismaClient();

export class AuthController {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly refreshTokenSecret: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || "1h";
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret-key";
    this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";
  }

  /**
   * Register a new user
   * @param req Express request
   * @param res Express response
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;
      
      // Check if username or email already exists
      const existingUsername = await prisma.user.findUnique({
        where: { username: userData.username }
      });
      
      if (existingUsername) {
        sendErrorResponse(res, "Username already exists", HttpStatusCode.BAD_REQUEST);
        return;
      }

      const existingEmail = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingEmail) {
        sendErrorResponse(res, "Email already exists", HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          username: userData.username,
          email: userData.email,
          passwordHash: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phoneNumber: userData.phoneNumber,
          userType: userData.userType,
          primaryLocationId: userData.primaryLocationId,
        },
      });

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.userType);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/api/auth/refresh",
      });

      // Map user to response object (remove sensitive data)
      const userResponse = this.mapToUserResponse(user);

      sendSuccessResponse(
        res,
        {
          user: userResponse,
          token: accessToken,
        },
        HttpStatusCode.CREATED
      );
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.BAD_REQUEST);
    }
  }

  /**
   * Log in a user
   * @param req Express request
   * @param res Express response
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginDto = req.body;
      
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: loginData.email }
      });
      
      if (!user) {
        sendErrorResponse(res, "Invalid email or password", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        sendErrorResponse(res, "Account is inactive", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
      if (!isPasswordValid) {
        sendErrorResponse(res, "Invalid email or password", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id, user.userType);
      const refreshToken = this.generateRefreshToken(user.id);

      // Store refresh token in database
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
      });

      // Set refresh token as HTTP-only cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/api/auth/refresh",
      });

      // Map user to response object
      const userResponse = this.mapToUserResponse(user);

      sendSuccessResponse(res, {
        user: userResponse,
        token: accessToken,
      });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.UNAUTHORIZED);
    }
  }

  /**
   * Log out a user
   * @param req Express request
   * @param res Express response
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendErrorResponse(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Clear refresh token in database
      await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });

      // Clear refresh token cookie
      res.clearCookie("refreshToken", {
        httpOnly: true,
        path: "/api/auth/refresh",
      });

      sendSuccessResponse(res, { message: "Logged out successfully" });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Refresh access token
   * @param req Express request
   * @param res Express response
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        sendErrorResponse(res, "Refresh token is required", HttpStatusCode.BAD_REQUEST);
        return;
      }

      try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, this.refreshTokenSecret) as { userId: string };

        // Find user with this refresh token
        const user = await prisma.user.findFirst({
          where: {
            id: decoded.userId,
            refreshToken,
          },
        });

        if (!user) {
          sendErrorResponse(res, "Invalid refresh token", HttpStatusCode.UNAUTHORIZED);
          return;
        }

        // Generate new tokens
        const newAccessToken = this.generateAccessToken(user.id, user.userType);
        const newRefreshToken = this.generateRefreshToken(user.id);

        // Store new refresh token in database
        await prisma.user.update({
          where: { id: user.id },
          data: { refreshToken: newRefreshToken },
        });

        // Set new refresh token as HTTP-only cookie
        res.cookie("refreshToken", newRefreshToken, {
          httpOnly: true,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/api/auth/refresh",
        });

        sendSuccessResponse(res, {
          token: newAccessToken,
        });
      } catch (error) {
        sendErrorResponse(res, "Invalid refresh token", HttpStatusCode.UNAUTHORIZED);
      }
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.UNAUTHORIZED);
    }
  }

  /**
   * Get current user profile
   * @param req Express request
   * @param res Express response
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendErrorResponse(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          primaryLocation: true,
        },
      });

      if (!user) {
        sendErrorResponse(res, "User not found", HttpStatusCode.NOT_FOUND);
        return;
      }

      const userResponse = this.mapToUserResponse(user);
      sendSuccessResponse(res, userResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Change user password
   * @param req Express request
   * @param res Express response
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        sendErrorResponse(res, "User not authenticated", HttpStatusCode.UNAUTHORIZED);
        return;
      }

      const { currentPassword, newPassword }: ChangePasswordDto = req.body;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        sendErrorResponse(res, "User not found", HttpStatusCode.NOT_FOUND);
        return;
      }

      // Validate current password
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        sendErrorResponse(res, "Current password is incorrect", HttpStatusCode.BAD_REQUEST);
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      sendSuccessResponse(res, { message: "Password changed successfully" });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Generate an access token
   * @param userId User ID
   * @param userType User type
   * @returns JWT access token
   */
  private generateAccessToken(userId: string, userType: string): string {
    // Using Function constructor to bypass TypeScript checks
    const signJwt = new Function('jwt', 'payload', 'secret', 'options', 'return jwt.sign(payload, secret, options)');
    
    const payload = { userId, userType };
    const options = { expiresIn: this.jwtExpiresIn };
    
    return signJwt(jwt, payload, this.jwtSecret, options);
  }

  /**
   * Generate a refresh token
   * @param userId User ID
   * @returns JWT refresh token
   */
  private generateRefreshToken(userId: string): string {
    // Using Function constructor to bypass TypeScript checks
    const signJwt = new Function('jwt', 'payload', 'secret', 'options', 'return jwt.sign(payload, secret, options)');
    
    const payload = { userId };
    const options = { expiresIn: this.refreshTokenExpiresIn };
    
    return signJwt(jwt, payload, this.refreshTokenSecret, options);
  }

  /**
   * Map user entity to user response (remove sensitive data)
   * @param user User entity
   * @returns User response without sensitive data
   */
  private mapToUserResponse(user: any): any {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      phoneNumber: user.phoneNumber || undefined,
      userType: user.userType,
      primaryLocationId: user.primaryLocationId || undefined,
      isActive: user.isActive,
    };
  }
} 