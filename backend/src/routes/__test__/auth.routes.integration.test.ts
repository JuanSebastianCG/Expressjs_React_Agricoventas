import request from "supertest"
import express from "express"
import authRoutes from "../auth.routes"
import { AuthController } from "../../controllers/auth.controller"
import { validate } from "../../middleware/validation.middleware"
import { authenticate } from "../../middleware/auth.middleware"

// Mock dependencies
jest.mock("../../controllers/auth.controller")
jest.mock("../../middleware/validation.middleware")
jest.mock("../../middleware/auth.middleware")

describe("Auth Routes Integration", () => {
  let app: express.Application
  let mockAuthController: jest.Mocked<AuthController>

  beforeEach(() => {
    jest.clearAllMocks()

    // Create a new Express app
    app = express()
    app.use(express.json())

    // Mock the auth controller
    mockAuthController = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
      getProfile: jest.fn(),
    } as unknown as jest.Mocked<AuthController>

    // Mock the AuthController constructor
    ;(AuthController as jest.Mock) = jest.fn(() => mockAuthController)

    // Mock middleware
    ;(validate as jest.Mock) = jest.fn(() => (req: any, res: any, next: any) => next())
    ;(authenticate as jest.Mock) = jest.fn((req: any, res: any, next: any) => {
      req.user = { userId: "1", username: "testuser", role: "user" }
      next()
    })

    // Use the auth routes
    app.use("/api/auth", authRoutes)
  })

  describe("POST /api/auth/register", () => {
    it("should call register controller method", async () => {
      // Arrange
      const registerData = {
        fullName: "Test User",
        username: "testuser",
        email: "test@example.com",
        password: "Password123!",
      }

      mockAuthController.register.mockImplementation(async (req, res) => {
        res.status(201).json({
          success: true,
          data: {
            user: {
              id: "1",
              fullName: "Test User",
              username: "testuser",
              email: "test@example.com",
            },
            accessToken: "mock-access-token",
          },
        })
        return Promise.resolve()
      })

      // Act
      const response = await request(app).post("/api/auth/register").send(registerData)

      // Assert
      expect(response.status).toBe(201)
      expect(mockAuthController.register).toHaveBeenCalled()
      expect(response.body).toHaveProperty("success", true)
      expect(response.body.data).toHaveProperty("user")
      expect(response.body.data).toHaveProperty("accessToken")
    })
  })

  describe("POST /api/auth/login", () => {
    it("should call login controller method", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "Password123!",
      }

      mockAuthController.login.mockImplementation(async (req, res) => {
        res.status(200).json({
          success: true,
          data: {
            user: {
              id: "1",
              fullName: "Test User",
              username: "testuser",
              email: "test@example.com",
            },
            accessToken: "mock-access-token",
          },
        })
        return Promise.resolve()
      })

      // Act
      const response = await request(app).post("/api/auth/login").send(loginData)

      // Assert
      expect(response.status).toBe(200)
      expect(mockAuthController.login).toHaveBeenCalled()
      expect(response.body).toHaveProperty("success", true)
      expect(response.body.data).toHaveProperty("user")
      expect(response.body.data).toHaveProperty("accessToken")
    })
  })

  describe("POST /api/auth/logout", () => {
    it("should call logout controller method", async () => {
      // Arrange
      mockAuthController.logout.mockImplementation(async (req, res) => {
        res.status(200).json({
          success: true,
          message: "Logout successful",
        })
        return Promise.resolve()
      })

      // Act
      const response = await request(app).post("/api/auth/logout").set("Authorization", "Bearer mock-token")

      // Assert
      expect(response.status).toBe(200)
      expect(mockAuthController.logout).toHaveBeenCalled()
      expect(response.body).toHaveProperty("success", true)
      expect(response.body).toHaveProperty("message", "Logout successful")
    })
  })

  describe("POST /api/auth/refresh", () => {
    it("should call refreshTokens controller method", async () => {
      // Arrange
      mockAuthController.refreshTokens.mockImplementation(async (req, res) => {
        res.status(200).json({
          success: true,
          data: {
            accessToken: "new-mock-access-token",
          },
        })
        return Promise.resolve()
      })

      // Act
      const response = await request(app).post("/api/auth/refresh").set("Cookie", ["refreshToken=mock-refresh-token"])

      // Assert
      expect(response.status).toBe(200)
      expect(mockAuthController.refreshTokens).toHaveBeenCalled()
      expect(response.body).toHaveProperty("success", true)
      expect(response.body.data).toHaveProperty("accessToken")
    })
  })

  describe("GET /api/auth/profile", () => {
    it("should call getProfile controller method", async () => {
      // Arrange
      mockAuthController.getProfile.mockImplementation(async (req, res) => {
        res.status(200).json({
          success: true,
          data: {
            user: {
              id: "1",
              fullName: "Test User",
              username: "testuser",
              email: "test@example.com",
            },
          },
        })
        return Promise.resolve()
      })

      // Act
      const response = await request(app).get("/api/auth/profile").set("Authorization", "Bearer mock-token")

      // Assert
      expect(response.status).toBe(200)
      expect(mockAuthController.getProfile).toHaveBeenCalled()
      expect(response.body).toHaveProperty("success", true)
      expect(response.body.data).toHaveProperty("user")
    })
  })
})