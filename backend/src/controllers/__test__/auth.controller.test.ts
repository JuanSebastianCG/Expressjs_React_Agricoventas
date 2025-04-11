import type { Request, Response } from "express"
import { AuthController } from "../auth.controller"
import { AuthService } from "../../services/auth.service"
import { TokenService } from "../../services/token.service"
import * as tokenUtils from "../../utils/tokenUtils"
import { sendSuccessResponse, sendSuccessNoDataResponse, sendErrorResponse } from "../../utils/responseHandler"

// Mock dependencies
jest.mock("../../services/auth.service")
jest.mock("../../services/token.service")
jest.mock("../../utils/tokenUtils")
jest.mock("../../utils/responseHandler")

describe("AuthController", () => {
  let authController: AuthController
  let mockAuthService: jest.Mocked<AuthService>
  let mockTokenService: jest.Mocked<TokenService>
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    
  jest.clearAllMocks()
  mockAuthService = new AuthService() as jest.Mocked<AuthService>
  mockTokenService = new TokenService() as jest.Mocked<TokenService>
  authController = new AuthController(mockAuthService, mockTokenService)

  mockRequest = {
    body: {},
    cookies: {},
    headers: {},
    user: undefined,
  }

  mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  }

  ;(sendSuccessResponse as jest.Mock).mockImplementation(() => {})
  ;(sendSuccessNoDataResponse as jest.Mock).mockImplementation(() => {})
  ;(sendErrorResponse as jest.Mock).mockImplementation(() => {})
})



  describe("register", () => {
    it("should register a user successfully", async () => {
      // Arrange
      const registerData = {
        fullName: "Test User",
        username: "testuser",
        email: "test@example.com",
        password: "Password123!",
      }
      mockRequest.body = registerData

      const mockResult = {
        user: {
          id: "1",
          fullName: "Test User",
          username: "testuser",
          email: "test@example.com",
          role: "user",
        },
        tokens: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
      }
      mockAuthService.register = jest.fn().mockResolvedValue(mockResult)

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(registerData)
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token",
        expect.objectContaining({ path: "/api/auth/refresh" }),
      )
      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockResponse,
        {
          user: mockResult.user,
          accessToken: mockResult.tokens.accessToken,
        },
        201,
      )
    })

    it("should return error if required fields are missing", async () => {
      // Arrange
      mockRequest.body = {
        username: "testuser",
        // Missing other required fields
      }

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.register).not.toHaveBeenCalled()
      expect(sendErrorResponse).toHaveBeenCalledWith(mockResponse, { message: "All fields are required" }, 400)
    })

    it("should handle username already exists error", async () => {
      // Arrange
      mockRequest.body = {
        fullName: "Test User",
        username: "existinguser",
        email: "test@example.com",
        password: "Password123!",
      }

      mockAuthService.register = jest.fn().mockRejectedValue(new Error('Username already exists: "existinguser"'))

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(mockRequest.body)
      expect(sendErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        { message: 'Username "existinguser" already exists. Please try a different username.' },
        409,
      )
    })

    it("should handle email already exists error", async () => {
      // Arrange
      mockRequest.body = {
        fullName: "Test User",
        username: "testuser",
        email: "existing@example.com",
        password: "Password123!",
      }

      mockAuthService.register = jest.fn().mockRejectedValue(new Error('Email already exists: "existing@example.com"'))

      // Act
      await authController.register(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(mockRequest.body)
      expect(sendErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        { message: 'Email "existing@example.com" already exists. Please use a different email or try to login.' },
        409,
      )
    })
  })

  describe("login", () => {
    it("should login a user successfully", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "Password123!",
      }
      mockRequest.body = loginData

      const mockResult = {
        user: {
          id: "1",
          fullName: "Test User",
          username: "testuser",
          email: "test@example.com",
          role: "user",
        },
        tokens: {
          accessToken: "access-token",
          refreshToken: "refresh-token",
        },
      }
      mockAuthService.login = jest.fn().mockResolvedValue(mockResult)

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginData)
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token",
        expect.objectContaining({ path: "/api/auth/refresh" }),
      )
      expect(sendSuccessResponse).toHaveBeenCalledWith(mockResponse, {
        user: mockResult.user,
        accessToken: mockResult.tokens.accessToken,
      })
    })

    it("should return error if required fields are missing", async () => {
      // Arrange
      mockRequest.body = {
        username: "testuser",
        // Missing password
      }

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.login).not.toHaveBeenCalled()
      expect(sendErrorResponse).toHaveBeenCalledWith(
        mockResponse,
        { message: "Username and password are required" },
        400,
      )
    })

    it("should handle authentication error", async () => {
      // Arrange
      mockRequest.body = {
        username: "testuser",
        password: "WrongPassword",
      }

      mockAuthService.login = jest.fn().mockRejectedValue(new Error("Invalid credentials"))

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(mockRequest.body)
      expect(sendErrorResponse).toHaveBeenCalledWith(mockResponse, { message: "Invalid credentials" }, 401)
    })
  })

  describe("logout", () => {
    it("should logout a user successfully", async () => {
      // Arrange
      mockRequest.user = {
        userId: "1",
        username: "testuser",
        role: "user",
      }
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      }
      ;(tokenUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: "1",
        username: "testuser",
        role: "user",
        exp: Math.floor(Date.now() / 1000) + 3600,
      })

      mockAuthService.logout = jest.fn().mockResolvedValue(undefined)
      mockTokenService.blacklistToken = jest.fn().mockResolvedValue(undefined)

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(tokenUtils.verifyAccessToken).toHaveBeenCalledWith("valid-token")
      expect(mockTokenService.blacklistToken).toHaveBeenCalledWith("valid-token", expect.any(Date))
      expect(mockAuthService.logout).toHaveBeenCalledWith("1")
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        "refreshToken",
        expect.objectContaining({ path: "/api/auth/refresh" }),
      )
      expect(sendSuccessNoDataResponse).toHaveBeenCalledWith(mockResponse, "Logout successful")
    })

    it("should return error if user is not authenticated", async () => {
      // Arrange
      mockRequest.user = undefined

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.logout).not.toHaveBeenCalled()
      expect(sendErrorResponse).toHaveBeenCalledWith(mockResponse, { message: "Not authenticated" }, 401)
    })
  })

  describe("refreshTokens", () => {
    it("should refresh tokens successfully", async () => {
      // Arrange
      mockRequest.cookies = {
        refreshToken: "valid-refresh-token",
      }

      const mockTokens = {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      }
      mockAuthService.refreshTokens = jest.fn().mockResolvedValue(mockTokens)

      // Act
      await authController.refreshTokens(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith("valid-refresh-token")
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "new-refresh-token",
        expect.objectContaining({ path: "/api/auth/refresh" }),
      )
      expect(sendSuccessResponse).toHaveBeenCalledWith(mockResponse, { accessToken: "new-access-token" })
    })

    it("should return error if refresh token is not found", async () => {
      // Arrange
      mockRequest.cookies = {}

      // Act
      await authController.refreshTokens(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.refreshTokens).not.toHaveBeenCalled()
      expect(sendErrorResponse).toHaveBeenCalledWith(mockResponse, { message: "Refresh token not found" }, 401)
    })

    it("should handle token refresh error", async () => {
      // Arrange
      mockRequest.cookies = {
        refreshToken: "invalid-refresh-token",
      }

      mockAuthService.refreshTokens = jest.fn().mockRejectedValue(new Error("Invalid refresh token"))

      // Act
      await authController.refreshTokens(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith("invalid-refresh-token")
      expect(sendErrorResponse).toHaveBeenCalledWith(mockResponse, { message: "Invalid refresh token" }, 401)
    })
  })

  describe("getProfile", () => {
    it("should get user profile successfully", async () => {
      // Arrange
      mockRequest.user = {
        userId: "1",
        username: "testuser",
        role: "user",
      }

      const mockUser = {
        id: "1",
        fullName: "Test User",
        username: "testuser",
        email: "test@example.com",
        role: "user",
      }
      mockAuthService.getProfile = jest.fn().mockResolvedValue(mockUser)

      // Act
      await authController.getProfile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.getProfile).toHaveBeenCalledWith("1")
      expect(sendSuccessResponse).toHaveBeenCalledWith(mockResponse, { user: mockUser })
    })

    it("should return error if user is not authenticated", async () => {
      // Arrange
      mockRequest.user = undefined

      // Act
      await authController.getProfile(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(mockAuthService.getProfile).not.toHaveBeenCalled()
      expect(sendErrorResponse).toHaveBeenCalledWith(mockResponse, { message: "Not authenticated" }, 401)
    })
  })
})
