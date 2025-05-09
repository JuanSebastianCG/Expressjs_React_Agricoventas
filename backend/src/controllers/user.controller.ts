import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ApiError } from '../middleware/error.middleware';
import { userToSafeUser, UpdateUserInput, UserIdParam } from '../schemas/user.schema';
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

  /**
   * Get current user's profile
   */
  getMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'Not authenticated');
      }

      const userId = req.user.userId;
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
   * Update current user's profile
   */
  updateMyProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'Not authenticated');
      }

      const userId = req.user.userId;
      const updateData = req.body;

      // Check if user exists
      const existingUser = await this.userService.findById(userId);
      if (!existingUser) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'User not found');
      }

      // Prevent role changes 
      if (updateData.role) {
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
   * Update profile image for current user
   */
  updateCurrentProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'Not authenticated');
      }
      
      // Verificar si tenemos un archivo o una URL
      let profileImageUrl: string;
      
      if (req.file) {
        // Si hay un archivo subido, usamos su ruta
        profileImageUrl = `/uploads/profiles/${req.file.filename}`;
      } else if (req.body && req.body.imageUrl) {
        // Si no hay archivo pero sí URL, usamos esa URL
        profileImageUrl = req.body.imageUrl;
      } else {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, 'No image provided');
      }
      
      const userId = req.user.userId;
      const user = await this.userService.findById(userId);
      
      if (!user) {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'User not found');
      }
      
      // Actualizar usuario con la nueva imagen
      const updatedUser = await this.userService.update(userId, {
        profileImage: profileImageUrl
      });
      
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
   * Update profile image for user by ID
   */
  updateProfileImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.params.id;
      
      // Verificar si tenemos un archivo o una URL
      let profileImageUrl: string;
      
      if (req.file) {
        // Si hay un archivo subido, usamos su ruta
        profileImageUrl = `/uploads/profiles/${req.file.filename}`;
      } else if (req.body && req.body.imageUrl) {
        // Si no hay archivo pero sí URL, usamos esa URL
        profileImageUrl = req.body.imageUrl;
      } else {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, 'No image provided');
      }
      
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
      
      // Actualizar usuario con la nueva imagen
      const updatedUser = await this.userService.update(userId, {
        profileImage: profileImageUrl
      });
      
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
}
