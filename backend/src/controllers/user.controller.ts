import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiError } from '../middleware/error.middleware';
import { userToSafeUser } from '../types/auth.types';
import { sendSuccessResponse, sendSuccessNoDataResponse, sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';

/**
 * User controller
 */
export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Get all users
   */
  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.findAll();

      sendSuccessResponse(res, { users });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, error.message);
      }
      throw error;
    }
  };

  /**
   * Get user by ID
   */
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;

      const user = await this.userService.findById(userId);
      if (!user) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'User not found');
      }

      sendSuccessResponse(res, {
        user: userToSafeUser(user),
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          throw new ApiError(HttpStatusCode.NOT_FOUND, error.message);
        }
        throw new ApiError(HttpStatusCode.BAD_REQUEST, error.message);
      }
      throw error;
    }
  };

  /**
   * Update user
   */
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      // Check if user exists
      const existingUser = await this.userService.findById(userId);
      if (!existingUser) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'User not found');
      }

      // Check if current user has permission to update
      // Only allow updates to own account unless admin
      if (req.user?.userId !== userId && req.user?.role !== 'admin') {
        throw new ApiError(HttpStatusCode.FORBIDDEN, 'Forbidden');
      }

      // Prevent role changes unless admin
      if (updateData.role && req.user?.role !== 'admin') {
        throw new ApiError(HttpStatusCode.FORBIDDEN, 'Cannot change role');
      }

      const updatedUser = await this.userService.update(userId, updateData);

      sendSuccessResponse(res, {
        user: userToSafeUser(updatedUser),
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          throw new ApiError(HttpStatusCode.NOT_FOUND, error.message);
        }
        throw new ApiError(HttpStatusCode.BAD_REQUEST, error.message);
      }
      throw error;
    }
  };

  /**
   * Delete user
   */
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;

      // Check if user exists
      const existingUser = await this.userService.findById(userId);
      if (!existingUser) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'User not found');
      }

      // Check if current user has permission to delete
      // Only allow deleting own account unless admin
      if (req.user?.userId !== userId && req.user?.role !== 'admin') {
        throw new ApiError(HttpStatusCode.FORBIDDEN, 'Forbidden');
      }

      await this.userService.delete(userId);

      sendSuccessNoDataResponse(res, 'User deleted');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'User not found') {
          throw new ApiError(HttpStatusCode.NOT_FOUND, error.message);
        }
        throw new ApiError(HttpStatusCode.BAD_REQUEST, error.message);
      }
      throw error;
    }
  };
}
