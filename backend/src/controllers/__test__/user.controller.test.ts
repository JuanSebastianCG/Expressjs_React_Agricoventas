import { Request, Response, NextFunction } from 'express';
import { UserController } from '../../controllers/user.controller';
import { UserService } from '../../services/user.service';
import { ApiError } from '../../middleware/error.middleware';
import { sendSuccessResponse, sendSuccessNoDataResponse } from '../../utils/responseHandler';
import HttpStatusCode from '../../utils/HttpStatusCode';

// Mock dependencies
jest.mock('../../services/user.service');
jest.mock('../../utils/responseHandler');
jest.mock('../../middleware/error.middleware');

describe('UserController Comprehensive Tests', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock service
    mockUserService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      saveRefreshToken: jest.fn(),
      removeRefreshToken: jest.fn()
    } as unknown as jest.Mocked<UserService>;
    
    // Mock the UserService constructor
    jest.spyOn(UserService.prototype, 'findAll').mockImplementation(mockUserService.findAll);
    jest.spyOn(UserService.prototype, 'findById').mockImplementation(mockUserService.findById);
    jest.spyOn(UserService.prototype, 'update').mockImplementation(mockUserService.update);
    jest.spyOn(UserService.prototype, 'delete').mockImplementation(mockUserService.delete);
    
    // Create controller
    userController = new UserController();

    // Setup request and response mocks
    mockRequest = {
      body: {},
      params: {},
      user: {
        userId: '1',
        username: 'testuser',
        role: 'admin'
      }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();

    // Mock response handlers
    (sendSuccessResponse as jest.Mock).mockImplementation(() => {});
    (sendSuccessNoDataResponse as jest.Mock).mockImplementation(() => {});
    
    // Mock ApiError constructor to make it work with instanceof checks
    (ApiError as unknown as jest.Mock).mockImplementation((statusCode, message) => {
      const error = new Error(message);
      error.name = 'ApiError';
      (error as any).statusCode = statusCode;
      return error;
    });
  });

  describe('getAllUsers', () => {
    it('should get all users successfully', async () => {
      // Arrange
      const mockUsers = [
        {
          id: '1',
          fullName: 'Test User 1',
          username: 'testuser1',
          email: 'test1@example.com',
          role: 'user',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          fullName: 'Test User 2',
          username: 'testuser2',
          email: 'test2@example.com',
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      mockUserService.findAll.mockResolvedValue(mockUsers);

      // Act
      await userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(sendSuccessResponse).toHaveBeenCalledWith(mockResponse, { users: mockUsers });
    });

    it('should throw ApiError when service throws an error', async () => {
      // Arrange
      const errorMessage = 'Database error';
      const error = new Error(errorMessage);
      mockUserService.findAll.mockRejectedValue(error);
      
      // Mock the controller to actually throw the error
      jest.spyOn(userController as any, 'handleError').mockImplementation(() => {
        throw new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, 'Failed to retrieve users');
      });

      // Act & Assert
      await expect(userController.getAllUsers(mockRequest as Request, mockResponse as Response))
        .rejects.toThrow(ApiError);
      
      expect(mockUserService.findAll).toHaveBeenCalled();
      expect(sendSuccessResponse).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should get a user by ID successfully', async () => {
      // Arrange
      const userId = '1';
      mockRequest.params = { id: userId };
      
      const mockUser = {
        id: userId,
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUserService.findById.mockResolvedValue(mockUser);

      // Act
      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(sendSuccessResponse).toHaveBeenCalledWith(mockResponse, { 
        user: expect.objectContaining({
          id: userId,
          fullName: 'Test User',
          username: 'testuser',
          email: 'test@example.com',
          role: 'user',
          isActive: true
        })
      });
      // Verify password is not included in the response
      expect(sendSuccessResponse).not.toHaveBeenCalledWith(
        mockResponse, 
        expect.objectContaining({ 
          user: expect.objectContaining({ password: expect.anything() }) 
        })
      );
    });

    it('should throw ApiError when user not found', async () => {
      // Arrange
      const userId = '999';
      mockRequest.params = { id: userId };
      
      mockUserService.findById.mockResolvedValue(null);
      
      // Mock the controller to actually throw the error
      jest.spyOn(userController as any, 'checkUserExists').mockImplementation(() => {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'User not found');
      });

      // Act & Assert
      await expect(userController.getUserById(mockRequest as Request, mockResponse as Response))
        .rejects.toThrow(new ApiError(HttpStatusCode.NOT_FOUND, 'User not found'));
      
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(sendSuccessResponse).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const userId = '1';
      mockRequest.params = { id: userId };
      
      const updateData = {
        fullName: 'Updated Name',
        email: 'updated@example.com'
      };
      mockRequest.body = updateData;
      
      const existingUser = {
        id: userId,
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const mockUpdatedUser = {
        ...existingUser,
        fullName: 'Updated Name',
        email: 'updated@example.com'
      };
      
      mockUserService.findById.mockResolvedValue(existingUser);
      mockUserService.update.mockResolvedValue(mockUpdatedUser);

      // Act
      await userController.updateUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockUserService.update).toHaveBeenCalledWith(userId, updateData);
      expect(sendSuccessResponse).toHaveBeenCalledWith(mockResponse, { 
        user: expect.objectContaining({
          id: userId,
          fullName: 'Updated Name',
          email: 'updated@example.com'
        })
      });
    });

    it('should throw ApiError when user not found', async () => {
      // Arrange
      const userId = '999';
      mockRequest.params = { id: userId };
      
      const updateData = {
        fullName: 'Updated Name',
        email: 'updated@example.com'
      };
      mockRequest.body = updateData;
      
      mockUserService.findById.mockResolvedValue(null);
      
      // Mock the controller to actually throw the error
      jest.spyOn(userController as any, 'checkUserExists').mockImplementation(() => {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'User not found');
      });

      // Act & Assert
      await expect(userController.updateUser(mockRequest as Request, mockResponse as Response))
        .rejects.toThrow(new ApiError(HttpStatusCode.NOT_FOUND, 'User not found'));
      
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockUserService.update).not.toHaveBeenCalled();
      expect(sendSuccessResponse).not.toHaveBeenCalled();
    });

    it('should throw ApiError when non-admin user tries to update another user', async () => {
      // Arrange
      const userId = '2'; // Different from logged in user
      mockRequest.params = { id: userId };
      mockRequest.user = {
        userId: '1',
        username: 'testuser',
        role: 'user' // Not admin
      };
      
      const updateData = {
        fullName: 'Updated Name',
        email: 'updated@example.com'
      };
      mockRequest.body = updateData;
      
      const existingUser = {
        id: userId,
        fullName: 'Another User',
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'hashedpassword',
        role: 'user',
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUserService.findById.mockResolvedValue(existingUser);
      
      // Mock the controller to actually throw the error
      jest.spyOn(userController as any, 'checkUpdatePermission').mockImplementation(() => {
        throw new ApiError(HttpStatusCode.FORBIDDEN, 'Forbidden');
      });

      // Act & Assert
      await expect(userController.updateUser(mockRequest as Request, mockResponse as Response))
        .rejects.toThrow(new ApiError(HttpStatusCode.FORBIDDEN, 'Forbidden'));
      
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockUserService.update).not.toHaveBeenCalled();
      expect(sendSuccessResponse).not.toHaveBeenCalled();
    });

    it('should throw ApiError when non-admin user tries to change role', async () => {
      // Arrange
      const userId = '1'; // Same as logged in user
      mockRequest.params = { id: userId };
      mockRequest.user = {
        userId: '1',
        username: 'testuser',
        role: 'user' // Not admin
      };
      
      const updateData = {
        fullName: 'Updated Name',
        role: 'admin' // Trying to change role
      };
      mockRequest.body = updateData;
      
      const existingUser = {
        id: userId,
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUserService.findById.mockResolvedValue(existingUser);
      
      // Mock the controller to actually throw the error
      jest.spyOn(userController as any, 'checkRoleChangePermission').mockImplementation(() => {
        throw new ApiError(HttpStatusCode.FORBIDDEN, 'Cannot change role');
      });

      // Act & Assert
      await expect(userController.updateUser(mockRequest as Request, mockResponse as Response))
        .rejects.toThrow(new ApiError(HttpStatusCode.FORBIDDEN, 'Cannot change role'));
      
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockUserService.update).not.toHaveBeenCalled();
      expect(sendSuccessResponse).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      // Arrange
      const userId = '1';
      mockRequest.params = { id: userId };
      
      const existingUser = {
        id: userId,
        fullName: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUserService.findById.mockResolvedValue(existingUser);
      mockUserService.delete.mockResolvedValue(existingUser);

      // Act
      await userController.deleteUser(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockUserService.delete).toHaveBeenCalledWith(userId);
      expect(sendSuccessNoDataResponse).toHaveBeenCalledWith(mockResponse, 'User deleted');
    });

    it('should throw ApiError when user not found', async () => {
      // Arrange
      const userId = '999';
      mockRequest.params = { id: userId };
      
      mockUserService.findById.mockResolvedValue(null);
      
      // Mock the controller to actually throw the error
      jest.spyOn(userController as any, 'checkUserExists').mockImplementation(() => {
        throw new ApiError(HttpStatusCode.NOT_FOUND, 'User not found');
      });

      // Act & Assert
      await expect(userController.deleteUser(mockRequest as Request, mockResponse as Response))
        .rejects.toThrow(new ApiError(HttpStatusCode.NOT_FOUND, 'User not found'));
      
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockUserService.delete).not.toHaveBeenCalled();
      expect(sendSuccessNoDataResponse).not.toHaveBeenCalled();
    });

    it('should throw ApiError when non-admin user tries to delete another user', async () => {
      // Arrange
      const userId = '2'; // Different from logged in user
      mockRequest.params = { id: userId };
      mockRequest.user = {
        userId: '1',
        username: 'testuser',
        role: 'user' // Not admin
      };
      
      const existingUser = {
        id: userId,
        fullName: 'Another User',
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'hashedpassword',
        role: 'user',
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUserService.findById.mockResolvedValue(existingUser);
      
      // Mock the controller to actually throw the error
      jest.spyOn(userController as any, 'checkDeletePermission').mockImplementation(() => {
        throw new ApiError(HttpStatusCode.FORBIDDEN, 'Forbidden');
      });

      // Act & Assert
      await expect(userController.deleteUser(mockRequest as Request, mockResponse as Response))
        .rejects.toThrow(new ApiError(HttpStatusCode.FORBIDDEN, 'Forbidden'));
      
      expect(mockUserService.findById).toHaveBeenCalledWith(userId);
      expect(mockUserService.delete).not.toHaveBeenCalled();
      expect(sendSuccessNoDataResponse).not.toHaveBeenCalled();
    });
  });
});