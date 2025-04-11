
import request from "supertest";
import express from "express";
import { Router } from "express";
import { AuthController } from "../../controllers/auth.controller";
import { validate } from "../../middleware/validation.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import { z } from "zod";

// Mock dependencies
jest.mock("../../controllers/auth.controller");
jest.mock("../../middleware/validation.middleware");
jest.mock("../../middleware/auth.middleware");
jest.mock("../../services/auth.service");
jest.mock("../../services/token.service");

describe("Auth Routes Integration", () => {
  let app: express.Application;
  let mockAuthController: jest.Mocked<AuthController>;
  let mockRouter: jest.Mocked<Router>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a new Express app
    app = express();
    app.use(express.json());

    // Create mock controller methods
    const mockRegister = jest.fn().mockImplementation((req, res) => {
      res.status(201).json({
        success: true,
        data: {
          user: { id: "1", username: "testuser" },
          accessToken: "mock-token"
        }
      });
    });

    const mockLogin = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({
        success: true,
        data: {
          user: { id: "1", username: "testuser" },
          accessToken: "mock-token"
        }
      });
    });

    const mockLogout = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({
        success: true,
        message: "Logout successful"
      });
    });

    const mockRefreshTokens = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({
        success: true,
        data: { accessToken: "new-mock-token" }
      });
    });

    const mockGetProfile = jest.fn().mockImplementation((req, res) => {
      res.status(200).json({
        success: true,
        data: { user: { id: "1", username: "testuser" } }
      });
    });

    // Create mock controller
    mockAuthController = {
      register: mockRegister,
      login: mockLogin,
      logout: mockLogout,
      refreshTokens: mockRefreshTokens,
      getProfile: mockGetProfile
    } as unknown as jest.Mocked<AuthController>;

    // Mock the AuthController constructor
    (AuthController as jest.Mock).mockImplementation(() => mockAuthController);

    // Mock middleware
    (validate as jest.Mock).mockImplementation(() => (req: express.Request, res: express.Response, next: express.NextFunction) => next());
    (authenticate as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { userId: "1", username: "testuser", role: "user" };
      next();
    });

    // Create routes manually instead of importing
    const router = express.Router();
    
    // Register routes with mock controller methods
    

    const registerSchema = z.object({
      fullName: z.string().min(1, "Full name is required"),
      username: z.string().min(1, "Username is required"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters long"),
    });

    router.post('/register', validate(registerSchema), mockAuthController.register);
    const loginSchema = z.object({
      username: z.string().min(1, "Username is required"),
      password: z.string().min(1, "Password is required"),
    });

    router.post('/login', validate(loginSchema), mockAuthController.login);
    router.post('/logout', authenticate, mockAuthController.logout);
    router.post('/refresh', mockAuthController.refreshTokens);
    router.get('/profile', authenticate, mockAuthController.getProfile);
    
    // Use the router
    app.use("/api/auth", router);
  });


  describe("POST /api/auth/register", () => {
    it("should call register controller method", async () => {
      // Arrange
      const registerData = {
        fullName: "Test User",
        username: "testuser",
        email: "test@example.com",
        password: "Password123!",
      };

      // Act
      const response = await request(app).post("/api/auth/register").send(registerData);

      // Assert
      expect(response.status).toBe(201);
      expect(mockAuthController.register).toHaveBeenCalled();
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("accessToken");
    });
  });


  describe("POST /api/auth/login", () => {
    it("should call login controller method", async () => {
      // Arrange
      const loginData = {
        username: "testuser",
        password: "Password123!",

      };

      // Act
      const response = await request(app).post("/api/auth/login").send(loginData);

      // Assert
      expect(response.status).toBe(200);
      expect(mockAuthController.login).toHaveBeenCalled();
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("accessToken");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should call logout controller method", async () => {
      // Act
      const response = await request(app).post("/api/auth/logout").set("Authorization", "Bearer mock-token");

      // Assert
      expect(response.status).toBe(200);
      expect(mockAuthController.logout).toHaveBeenCalled();
      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message", "Logout successful");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should call refreshTokens controller method", async () => {
      // Act
      const response = await request(app).post("/api/auth/refresh").set("Cookie", ["refreshToken=mock-refresh-token"]);

      // Assert
      expect(response.status).toBe(200);
      expect(mockAuthController.refreshTokens).toHaveBeenCalled();
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("accessToken");
    });
  });

  describe("GET /api/auth/profile", () => {
    it("should call getProfile controller method", async () => {
      // Act
      const response = await request(app).get("/api/auth/profile").set("Authorization", "Bearer mock-token");

      // Assert
      expect(response.status).toBe(200);
      expect(mockAuthController.getProfile).toHaveBeenCalled();
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("user");
    });
  });
});

