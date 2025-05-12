import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../auth.middleware';
import * as tokenUtils from '../../utils/tokenUtils';
import { TokenService } from '../../services/token.service';
import { UserService } from '../../services/user.service';
import { sendUnauthorizedResponse } from '../../utils/responseHandler';
import { ApiError } from '../error.middleware';
import HttpStatusCode from '../../utils/HttpStatusCode';

// Mock dependencies
jest.mock('../../utils/tokenUtils');
jest.mock('../../services/token.service');
jest.mock('../../services/user.service');
jest.mock('../../utils/responseHandler');

describe('Auth Middleware Comprehensive Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let mockTokenService: jest.Mocked<TokenService>;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      headers: {},
      cookies: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();

    // Create mock services
    mockTokenService = {
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
      addToBlacklist: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<TokenService>;

    mockUserService = {
      findById: jest.fn().mockResolvedValue({
        id: '1',
        username: 'testuser',
        role: 'user'
      })
    } as unknown as jest.Mocked<UserService>;

    // Mock the TokenService constructor
    (TokenService as jest.Mock).mockImplementation(() => mockTokenService);
    
    // Mock the UserService constructor
    (UserService as jest.Mock).mockImplementation(() => mockUserService);
    
    // Mock tokenUtils
    (tokenUtils.verifyAccessToken as jest.Mock).mockReturnValue({
      userId: '1',
      username: 'testuser',
      role: 'user'
    });
    
    // Mock response handlers
    (sendUnauthorizedResponse as jest.Mock).mockImplementation(() => {});
  });

  describe('authenticate', () => {
    it('should authenticate with valid token in Authorization header', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith('valid-token');
      expect(tokenUtils.verifyAccessToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual({
        userId: '1',
        username: 'testuser',
        role: 'user'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate with valid token in cookies', async () => {
      // Arrange
      mockRequest.cookies = {
        accessToken: 'valid-cookie-token'
      };

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith('valid-cookie-token');
      expect(tokenUtils.verifyAccessToken).toHaveBeenCalledWith('valid-cookie-token');
      expect(mockRequest.user).toEqual({
        userId: '1',
        username: 'testuser',
        role: 'user'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if no token is provided', async () => {
      // Arrange - no token in headers or cookies

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenService.isTokenBlacklisted).not.toHaveBeenCalled();
      expect(tokenUtils.verifyAccessToken).not.toHaveBeenCalled();
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, 'No token provided');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is blacklisted', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer blacklisted-token'
      };
      
      mockTokenService.isTokenBlacklisted.mockResolvedValue(true);

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith('blacklisted-token');
      expect(tokenUtils.verifyAccessToken).not.toHaveBeenCalled();
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, 'Token has been invalidated');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token verification fails', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };
      
      const verificationError = new Error('Invalid token');
      (tokenUtils.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw verificationError;
      });

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith('invalid-token');
      expect(tokenUtils.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, 'Invalid token');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle malformed Authorization header', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat'
      };

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenService.isTokenBlacklisted).not.toHaveBeenCalled();
      expect(tokenUtils.verifyAccessToken).not.toHaveBeenCalled();
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, 'No token provided');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors during authentication', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };
      
      const unexpectedError = new Error('Unexpected error');
      mockTokenService.isTokenBlacklisted.mockRejectedValue(unexpectedError);

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith('valid-token');
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, 'Authentication failed');
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should authorize user with required role', () => {
      // Arrange
      mockRequest.user = {
        userId: '1',
        username: 'testuser',
        role: 'admin'
      };
      
      const authorizeFn = authorize(['admin']);

      // Act
      authorizeFn(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authorize user with one of multiple required roles', () => {
      // Arrange
      mockRequest.user = {
        userId: '1',
        username: 'testuser',
        role: 'editor'
      };
      
      const authorizeFn = authorize(['admin', 'editor']);

      // Act
      authorizeFn(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user role is not authorized', () => {
      // Arrange
      mockRequest.user = {
        userId: '1',
        username: 'testuser',
        role: 'user'
      };
      
      const authorizeFn = authorize(['admin']);

      // Act
      authorizeFn(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Access denied',
          code: 'FORBIDDEN'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;
      
      const authorizeFn = authorize(['admin']);

      // Act
      authorizeFn(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty roles array', () => {
      // Arrange
      mockRequest.user = {
        userId: '1',
        username: 'testuser',
        role: 'user'
      };
      
      const authorizeFn = authorize([]);

      // Act
      authorizeFn(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });
});