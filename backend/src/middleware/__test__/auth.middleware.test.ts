
import { authenticate } from '../auth.middleware';
import { Request, Response, NextFunction } from 'express';
import * as tokenUtils from '../../utils/tokenUtils';
import { sendUnauthorizedResponse } from '../../utils/responseHandler';
import { TokenService } from '../../services/token.service';

// Mock dependencies
jest.mock('../../utils/tokenUtils');
jest.mock('../../utils/responseHandler');
jest.mock('../../services/token.service');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let mockTokenService: jest.Mocked<TokenService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup request mock
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token',
      },
      user: undefined
    };

    // Setup response mock
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Setup next function mock
    mockNext = jest.fn();

    // Setup TokenService mock
    mockTokenService = {
      isTokenBlacklisted: jest.fn().mockResolvedValue(false),
      blacklistToken: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<TokenService>;

    // Mock TokenService constructor
    (TokenService as jest.Mock).mockImplementation(() => mockTokenService);

    // Mock verifyAccessToken
    (tokenUtils.verifyAccessToken as jest.Mock).mockReturnValue({
      userId: '1',
      username: 'testuser',
      role: 'user',
    });

    // Mock sendUnauthorizedResponse
    (sendUnauthorizedResponse as jest.Mock).mockImplementation(() => {});
  });

  it('autentica correctamente con token válido', async () => {
    // Act
    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith('valid-token');
    expect(tokenUtils.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    expect(mockRequest.user).toEqual({
      userId: '1',
      username: 'testuser',
      role: 'user',
    });
    expect(mockNext).toHaveBeenCalled();
  });

  it('retorna 401 si el token está en blacklist', async () => {
    // Arrange
    mockTokenService.isTokenBlacklisted.mockResolvedValue(true);
    mockRequest.headers = { ...mockRequest.headers, authorization: 'Bearer blacklisted-token' };

    // Act
    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith('blacklisted-token');
    expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, 'Token has been invalidated');
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('llama next con error si hay fallo inesperado', async () => {
    // Arrange
    (tokenUtils.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    // Act
    await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});
