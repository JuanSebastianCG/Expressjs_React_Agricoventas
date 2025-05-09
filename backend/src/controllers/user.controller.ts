import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { UpdateUserDto } from "../schemas/user.schema";
import { sendSuccessResponse, sendErrorResponse, sendNotFoundResponse } from "../utils/responseHandler";
import HttpStatusCode from "../utils/HttpStatusCode";

const prisma = new PrismaClient();

export class UserController {
  /**
   * Get a user by ID
   * @param req Express request
   * @param res Express response
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;

      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        sendNotFoundResponse(res, "User not found");
        return;
      }

      // Map user to response object (remove sensitive data)
      const userResponse = this.mapToUserResponse(user);
      sendSuccessResponse(res, userResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update a user's profile
   * @param req Express request
   * @param res Express response
   */
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      const updateData: UpdateUserDto = req.body;

      // Check if the requesting user is updating their own profile or is an admin
      if (req.user?.userId !== userId && req.user?.userType !== "ADMIN") {
        sendErrorResponse(res, "You can only update your own profile", HttpStatusCode.FORBIDDEN);
        return;
      }

      // Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!userExists) {
        sendNotFoundResponse(res, "User not found");
        return;
      }

      // Prepare update data
      const updateDataForPrisma: any = { ...updateData };
      
      // If password is provided, hash it
      if (updateData.password) {
        updateDataForPrisma.passwordHash = await bcrypt.hash(updateData.password, 10);
        delete updateDataForPrisma.password;
      }

      // Don't update username if provided
      delete updateDataForPrisma.username;

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateDataForPrisma
      });

      // Map user to response object
      const userResponse = this.mapToUserResponse(updatedUser);
      sendSuccessResponse(res, userResponse);
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Check if a username is available
   * @param req Express request
   * @param res Express response
   */
  async checkUsernameAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== "string") {
        sendErrorResponse(res, "Username is required", HttpStatusCode.BAD_REQUEST);
        return;
      }
      
      const user = await prisma.user.findUnique({
        where: { username },
      });
      
      const isAvailable = !user;
      sendSuccessResponse(res, { isAvailable });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Check if an email is available
   * @param req Express request
   * @param res Express response
   */
  async checkEmailAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.query;

      if (!email || typeof email !== "string") {
        sendErrorResponse(res, "Email is required", HttpStatusCode.BAD_REQUEST);
        return;
      }
      
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      const isAvailable = !user;
      sendSuccessResponse(res, { isAvailable });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Deactivate a user account (soft delete)
   * @param req Express request
   * @param res Express response
   */
  async deactivateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.userId;
      
      // Check if the requesting user is deactivating their own account or is an admin
      if (req.user?.userId !== userId && req.user?.userType !== "ADMIN") {
        sendErrorResponse(res, "You can only deactivate your own account", HttpStatusCode.FORBIDDEN);
        return;
      }
      
      // Verify user exists
      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!userExists) {
        sendNotFoundResponse(res, "User not found");
        return;
      }

      // Deactivate user (soft delete)
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      sendSuccessResponse(res, { message: "User account deactivated successfully" });
    } catch (error: any) {
      sendErrorResponse(res, error.message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
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
      createdAt: user.createdAt,
    };
  }
} 