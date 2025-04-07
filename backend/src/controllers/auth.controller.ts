import { Request, Response, CookieOptions } from 'express';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { LoginCredentials, RegisterUserDto } from '../schemas/user.schema';
import { sendSuccessResponse, sendSuccessNoDataResponse, sendErrorResponse } from '../utils/responseHandler';
import HttpStatusCode from '../utils/HttpStatusCode';
import { COOKIE_CONFIG } from '../config/app';
import { verifyAccessToken } from '../utils/tokenUtils';

/**
 * Authentication controller
 */
export class AuthController {
  private authService: AuthService;
  private tokenService: TokenService;

  constructor() {
    this.authService = new AuthService();
    this.tokenService = new TokenService();
  }

  /**
   * Set refresh token cookie
   */
  private setRefreshTokenCookie(res: Response, token: string): void {
    const cookieOptions: CookieOptions = {
      ...(COOKIE_CONFIG as CookieOptions),
      path: '/api/auth/refresh',
    };
    res.cookie('refreshToken', token, cookieOptions);
  }

  /**
   * Clear refresh token cookie
   */
  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: COOKIE_CONFIG.secure,
      path: '/api/auth/refresh',
    });
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const userData: RegisterUserDto = req.body;

      // Validate required fields
      if (!userData.fullName || !userData.username || !userData.email || !userData.password) {
        sendErrorResponse(res, { message: 'All fields are required' }, HttpStatusCode.BAD_REQUEST);
        return;
      }

      const result = await this.authService.register(userData);

      // Set refresh token cookie if available
      if (result.tokens?.refreshToken) {
        this.setRefreshTokenCookie(res, result.tokens.refreshToken);
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
        if (error.message.includes('Username already exists')) {
          sendErrorResponse(
            res, 
            { message: `Username "${req.body.username}" already exists. Please try a different username.` },
            HttpStatusCode.CONFLICT
          );
        } else if (error.message.includes('Email already exists')) {
          sendErrorResponse(
            res, 
            { message: `Email "${req.body.email}" already exists. Please use a different email or try to login.` },
            HttpStatusCode.CONFLICT
          );
        } else {
          sendErrorResponse(
            res, 
            { message: error.message },
            HttpStatusCode.BAD_REQUEST
          );
        }
      } else {
        sendErrorResponse(
          res, 
          { message: 'An unknown error occurred' },
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
    }
  };

  /**
   * Login a user
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, password } = req.body;

      // Validate required fields
      if (!username || !password) {
        sendErrorResponse(res, { message: 'Username and password are required' }, HttpStatusCode.BAD_REQUEST);
        return;
      }

      const result = await this.authService.login({ username, password });

      // Set refresh token cookie if available
      if (result.tokens?.refreshToken) {
        this.setRefreshTokenCookie(res, result.tokens.refreshToken);
      }

      // Return user data and access token
      sendSuccessResponse(res, {
        user: result.user,
        accessToken: result.tokens?.accessToken,
      });
    } catch (error) {
      // Use 401 for authentication errors
      sendErrorResponse(
        res,
        { message: error instanceof Error ? error.message : 'Authentication failed' },
        HttpStatusCode.UNAUTHORIZED
      );
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
        sendErrorResponse(res, { message: 'Not authenticated' }, HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Blacklist the current token if available
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        const decoded = verifyAccessToken(token);
        if (decoded && decoded.exp) {
          await this.tokenService.blacklistToken(token, new Date(decoded.exp * 1000));
        }
      }

      // Logout user (remove refresh token from database)
      await this.authService.logout(userId);

      // Clear refresh token cookie
      this.clearRefreshTokenCookie(res);

      // Send success response
      sendSuccessNoDataResponse(res, 'Logout successful');
    } catch (error) {
      sendErrorResponse(
        res,
        { message: error instanceof Error ? error.message : 'Logout failed' },
        HttpStatusCode.BAD_REQUEST
      );
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
        sendErrorResponse(res, { message: 'Refresh token not found' }, HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Refresh tokens
      const tokens = await this.authService.refreshTokens(refreshToken);

      // Set new refresh token cookie
      this.setRefreshTokenCookie(res, tokens.refreshToken);

      // Return new access token
      sendSuccessResponse(res, {
        accessToken: tokens.accessToken,
      });
    } catch (error) {
      sendErrorResponse(
        res,
        { message: error instanceof Error ? error.message : 'Token refresh failed' },
        HttpStatusCode.UNAUTHORIZED
      );
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
        sendErrorResponse(res, { message: 'Not authenticated' }, HttpStatusCode.UNAUTHORIZED);
        return;
      }

      // Get user profile
      const user = await this.authService.getProfile(userId);

      // Return user profile
      sendSuccessResponse(res, { user });
    } catch (error) {
      sendErrorResponse(
        res,
        { message: error instanceof Error ? error.message : 'Failed to get profile' },
        HttpStatusCode.BAD_REQUEST
      );
    }
  };
}
