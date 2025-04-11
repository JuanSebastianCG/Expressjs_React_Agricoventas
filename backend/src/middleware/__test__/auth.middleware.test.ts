import type { Request, Response } from "express"
import { authenticate, authorize } from "../auth.middleware"
import { TokenService } from "../../services/token.service"
import * as tokenUtils from "../../utils/tokenUtils"
import { sendUnauthorizedResponse, sendForbiddenResponse } from "../../utils/responseHandler"
import { ApiError } from "../error.middleware"

// Mock dependencies
jest.mock("../../services/token.service")
jest.mock("../../utils/tokenUtils")
jest.mock("../../utils/responseHandler")

describe("Auth Middleware", () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: jest.Mock
  let mockTokenService: jest.Mocked<TokenService>

  beforeEach(() => {
    jest.clearAllMocks()
    mockTokenService = new TokenService() as jest.Mocked<TokenService>

    mockRequest = {
      headers: {},
      user: undefined,
    }

    mockResponse = {}
    mockNext = jest.fn()
    ;(sendUnauthorizedResponse as jest.Mock).mockImplementation(() => {})
    ;(sendForbiddenResponse as jest.Mock).mockImplementation(() => {})
  })

  describe("authenticate", () => {
    it("should authenticate a user with valid token", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      }

      mockTokenService.isTokenBlacklisted = jest.fn().mockResolvedValue(false)
      ;(tokenUtils.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: "1",
        username: "testuser",
        role: "user",
      })

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith("valid-token")
      expect(tokenUtils.verifyAccessToken).toHaveBeenCalledWith("valid-token")
      expect(mockRequest.user).toEqual({
        userId: "1",
        username: "testuser",
        role: "user",
      })
      expect(mockNext).toHaveBeenCalled()
      expect(sendUnauthorizedResponse).not.toHaveBeenCalled()
    })

    it("should return unauthorized if no authorization header", async () => {
      // Arrange
      mockRequest.headers = {}

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, "No token provided")
      expect(mockNext).not.toHaveBeenCalled()
    })

    it("should return unauthorized if invalid token format", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "InvalidFormat token",
      }

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, "Invalid token format. Use Bearer token")
      expect(mockNext).not.toHaveBeenCalled()
    })

    it("should return unauthorized if token is blacklisted", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer blacklisted-token",
      }

      mockTokenService.isTokenBlacklisted = jest.fn().mockResolvedValue(true)

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith("blacklisted-token")
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, "Token has been invalidated")
      expect(mockNext).not.toHaveBeenCalled()
    })

    it("should return unauthorized if token is invalid", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      }

      mockTokenService.isTokenBlacklisted = jest.fn().mockResolvedValue(false)
      ;(tokenUtils.verifyAccessToken as jest.Mock).mockReturnValue(null)

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith("invalid-token")
      expect(tokenUtils.verifyAccessToken).toHaveBeenCalledWith("invalid-token")
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, "Invalid or expired token")
      expect(mockNext).not.toHaveBeenCalled()
    })

    it("should call next with error if authentication fails unexpectedly", async () => {
      // Arrange
      mockRequest.headers = {
        authorization: "Bearer valid-token",
      }

      mockTokenService.isTokenBlacklisted = jest.fn().mockRejectedValue(new Error("Database error"))

      // Act
      await authenticate(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockTokenService.isTokenBlacklisted).toHaveBeenCalledWith("valid-token")
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError))
    })
  })

  describe("authorize", () => {
    it("should authorize a user with required role", () => {
      // Arrange
      mockRequest.user = {
        userId: "1",
        username: "admin",
        role: "admin",
      }

      const authorizeMiddleware = authorize(["admin"])

      // Act
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(sendUnauthorizedResponse).not.toHaveBeenCalled()
      expect(sendForbiddenResponse).not.toHaveBeenCalled()
    })

    it("should authorize a user with one of multiple allowed roles", () => {
      // Arrange
      mockRequest.user = {
        userId: "1",
        username: "manager",
        role: "manager",
      }

      const authorizeMiddleware = authorize(["admin", "manager"])

      // Act
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalled()
      expect(sendUnauthorizedResponse).not.toHaveBeenCalled()
      expect(sendForbiddenResponse).not.toHaveBeenCalled()
    })

    it("should return unauthorized if user is not authenticated", () => {
      // Arrange
      mockRequest.user = undefined

      const authorizeMiddleware = authorize(["admin"])

      // Act
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(sendUnauthorizedResponse).toHaveBeenCalledWith(mockResponse, "Authentication required")
      expect(mockNext).not.toHaveBeenCalled()
    })

    it("should return forbidden if user does not have required role", () => {
      // Arrange
      mockRequest.user = {
        userId: "1",
        username: "user",
        role: "user",
      }

      const authorizeMiddleware = authorize(["admin"])

      // Act
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(sendForbiddenResponse).toHaveBeenCalledWith(mockResponse, "Access denied. Required role: admin")
      expect(mockNext).not.toHaveBeenCalled()
    })

    it("should call next with error if authorization fails unexpectedly", () => {
      // Arrange
      mockRequest.user = {
        userId: "1",
        username: "user",
        role: "user",
      }

      // Mock an error during role check
      const authorizeMiddleware = authorize(["admin"])

      // Force an error during execution
      jest.spyOn(Array.prototype, "includes").mockImplementationOnce(() => {
        throw new Error("Unexpected error")
      })

      // Act
      authorizeMiddleware(mockRequest as Request, mockResponse as Response, mockNext)

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError))
    })
  })
})
