import { Request, Response, CookieOptions } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginCredentials, RegisterUserDto } from '../types/zod';
import { ApiError } from '../middleware/error.middleware';
import { sendSuccessResponse, sendSuccessNoDataResponse, sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';
import { COOKIE_CONFIG } from '../config/app';

/**
 * Authentication controller
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: RegisterUserDto = req.body;

      // Validate required fields
      if (!userData.fullName || !userData.username || !userData.email || !userData.password) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, 'All fields are required');
      }

      const result = await this.authService.register(userData);

      // Asegurar que el refreshToken existe
      if (result.tokens?.refreshToken) {
        // Set refresh token as HTTP-only cookie
        const cookieOptions: CookieOptions = {
          ...(COOKIE_CONFIG as CookieOptions),
          path: '/api/auth/refresh',
        };

        res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);
      }

      // Return user data and access token with 201 Created status
      sendSuccessResponse(
        res,
        {
          user: result.user,
          accessToken: result.tokens?.accessToken,
        },
        HttpStatusCode.CREATED
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('exists')) {
          throw new ApiError(HttpStatusCode.CONFLICT, error.message);
        }
        throw new ApiError(HttpStatusCode.BAD_REQUEST, error.message);
      }
      throw error;
    }
  };

  /**
   * Login a user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials: LoginCredentials = req.body;

      // Validate required fields
      if (!credentials.username || !credentials.password) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, 'Username and password are required');
      }

      const result = await this.authService.login(credentials);

      // Asegurar que el refreshToken existe
      if (result.tokens?.refreshToken) {
        // Set refresh token as HTTP-only cookie
        const cookieOptions: CookieOptions = {
          ...(COOKIE_CONFIG as CookieOptions),
          path: '/api/auth/refresh',
        };

        res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);
      }

      // Return user data and access token
      sendSuccessResponse(res, {
        user: result.user,
        accessToken: result.tokens?.accessToken,
      });
    } catch (error) {
      if (error instanceof Error) {
        // Use 401 for authentication errors
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, error.message);
      }
      throw error;
    }
  };

  /**
   * Logout a user
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get user ID from request
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'Not authenticated');
      }

      // Logout user
      await this.authService.logout(userId);

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: COOKIE_CONFIG.secure,
        path: '/api/auth/refresh',
      });

      // Use sendSuccessNoDataResponse for responses without data
      sendSuccessNoDataResponse(res, 'Logout successful');
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, error.message);
      }
      throw error;
    }
  };

  /**
   * Refresh tokens
   */
  refreshTokens = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get refresh token from cookie
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'Refresh token not found');
      }

      // Refresh tokens
      const tokens = await this.authService.refreshTokens(refreshToken);

      // Set new refresh token as HTTP-only cookie with values from config
      const cookieOptions: CookieOptions = {
        ...(COOKIE_CONFIG as CookieOptions),
        path: '/api/auth/refresh',
      };

      res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

      // Return new access token
      sendSuccessResponse(res, {
        accessToken: tokens.accessToken,
        // No incluimos refreshToken en la respuesta ya que está en la cookie
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, error.message);
      }
      throw error;
    }
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      // Get user ID from request
      const userId = req.user?.userId;
      if (!userId) {
        throw new ApiError(HttpStatusCode.UNAUTHORIZED, 'Not authenticated');
      }

      // Get user profile
      const user = await this.authService.getProfile(userId);

      // Return user profile
      sendSuccessResponse(res, { user });
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError(HttpStatusCode.BAD_REQUEST, error.message);
      }
      throw error;
    }
  };
}
