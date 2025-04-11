import { AuthService } from "../auth.service";
import { UserService } from "../user.service";
import * as tokenUtils from "../../utils/tokenUtils";
import * as passwordUtils from "../../utils/passwordUtils";
import { describe, beforeEach, it, expect, jest } from "@jest/globals";

// Define a User type to help with mocking
type User = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Mock dependencies
jest.mock("../user.service");
jest.mock("../../utils/tokenUtils");
jest.mock("../../utils/passwordUtils");

describe("AuthService", () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a new instance of the mocked UserService
    mockUserService = new UserService() as jest.Mocked<UserService>;
    
    // Replace the constructor to return our mockUserService
    (UserService as jest.Mock).mockImplementation(() => mockUserService);
    
    // Create a new instance of AuthService that will use our mockUserService
    authService = new AuthService();
  });

  describe("register", () => {
    const registerData = {
      fullName: "Test User",
      username: "testuser",
      email: "test@example.com",
      password: "Password123!",
    };

    it("should register a new user successfully", async () => {
      // Arrange
      const mockUser: User = {
        id: "4",
        ...registerData,
        password: "hashed-password",
        role: "user",
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Mock the async methods to return Promises
      mockUserService.findByUsername = jest.fn().mockResolvedValue(null);
      mockUserService.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserService.create = jest.fn().mockResolvedValue(mockUser);
      mockUserService.saveRefreshToken = jest.fn().mockResolvedValue({...mockUser, refreshToken: "test-refresh-token"});
      
      // Mock the token generation
      jest.spyOn(tokenUtils, "generateTokens").mockReturnValue({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      });

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(registerData.username);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockUserService.create).toHaveBeenCalledWith(registerData);
      expect(tokenUtils.generateTokens).toHaveBeenCalled();
      expect(mockUserService.saveRefreshToken).toHaveBeenCalledWith("4", "test-refresh-token");
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(result.tokens).toEqual({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      });
    });

    it("should throw an error if username already exists", async () => {
      // Arrange
      const existingUser: User = {
        id: "1",
        username: "testuser",
        email: "existing@example.com",
        fullName: "Existing User",
        password: "hashed-password",
        role: "user",
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Mock the async methods
      mockUserService.findByUsername = jest.fn().mockImplementation(async (username) => {
        if (username === "testuser") {
          return existingUser;
        }
        return null;
      });

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow("Username already exists");
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(registerData.username);
      expect(mockUserService.create).not.toHaveBeenCalled();
    });

    it("should throw an error if email already exists", async () => {
      // Arrange
      const existingUser: User = {
        id: "1",
        username: "otheruser",
        email: "test@example.com",
        fullName: "Existing User",
        password: "hashed-password",
        role: "user",
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Mock the async methods
      mockUserService.findByUsername = jest.fn().mockResolvedValue(null);
      mockUserService.findByEmail = jest.fn().mockImplementation(async (email) => {
        if (email === "test@example.com") {
          return existingUser;
        }
        return null;
      });

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow("Email already exists");
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(registerData.username);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockUserService.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    const loginCredentials = {
      username: "testuser",
      password: "Password123!",
    };

    it("should login a user successfully", async () => {
      // Arrange
      const mockUser: User = {
        id: "1",
        username: "testuser",
        password: "hashed-password",
        email: "test@example.com",
        fullName: "Test User",
        role: "user",
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Mock the async methods
      mockUserService.findByUsername = jest.fn().mockImplementation(async (username) => {
        if (username === "testuser") {
          return mockUser;
        }
        return null;
      });
      
      jest.spyOn(passwordUtils, "verifyPassword").mockResolvedValue(true);
      
      jest.spyOn(tokenUtils, "generateTokens").mockReturnValue({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      });
      
      mockUserService.saveRefreshToken = jest.fn().mockResolvedValue({
        ...mockUser,
        refreshToken: "test-refresh-token"
      });

      // Act
      const result = await authService.login(loginCredentials);

      // Assert
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(loginCredentials.username);
      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith(loginCredentials.password, mockUser.password);
      expect(tokenUtils.generateTokens).toHaveBeenCalled();
      expect(mockUserService.saveRefreshToken).toHaveBeenCalledWith("1", "test-refresh-token");
      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("tokens");
      expect(result.tokens).toEqual({
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      });
    });

    it("should throw an error if user is not found", async () => {
      // Arrange
      mockUserService.findByUsername = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginCredentials)).rejects.toThrow("Invalid credentials");
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(loginCredentials.username);
      expect(passwordUtils.verifyPassword).not.toHaveBeenCalled();
    });

    it("should throw an error if password is invalid", async () => {
      // Arrange
      const mockUser: User = {
        id: "1",
        username: "testuser",
        password: "hashed-password",
        email: "test@example.com",
        fullName: "Test User",
        role: "user",
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserService.findByUsername = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(passwordUtils, "verifyPassword").mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(loginCredentials)).rejects.toThrow("Invalid credentials");
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(loginCredentials.username);
      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith(loginCredentials.password, "hashed-password");
      expect(tokenUtils.generateTokens).not.toHaveBeenCalled();
    });

    it("should throw an error if user account is disabled", async () => {
      // Arrange
      const mockUser: User = {
        id: "1",
        username: "testuser",
        password: "hashed-password",
        email: "test@example.com",
        fullName: "Test User",
        role: "user",
        isActive: false,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserService.findByUsername = jest.fn().mockResolvedValue(mockUser);
      jest.spyOn(passwordUtils, "verifyPassword").mockResolvedValue(true);

      // Act & Assert
      await expect(authService.login(loginCredentials)).rejects.toThrow("User account is disabled");
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(loginCredentials.username);
      expect(passwordUtils.verifyPassword).toHaveBeenCalledWith(loginCredentials.password, "hashed-password");
      expect(tokenUtils.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should logout a user successfully", async () => {
      // Arrange
      const mockUser: User = {
        id: "1",
        username: "testuser",
        password: "hashed-password",
        email: "test@example.com",
        fullName: "Test User",
        role: "user",
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserService.removeRefreshToken = jest.fn().mockResolvedValue(mockUser);

      // Act
      await authService.logout("1");

      // Assert
      expect(mockUserService.removeRefreshToken).toHaveBeenCalledWith("1");
    });
  });

  describe("refreshTokens", () => {
    it("should refresh tokens successfully", async () => {
      // Arrange
      const refreshToken = "valid-refresh-token";
      
      jest.spyOn(tokenUtils, "verifyRefreshToken").mockReturnValue({
        userId: "1",
        username: "testuser",
        role: "user",
      });
      
      const mockUser: User = {
        id: "1",
        username: "testuser",
        password: "hashed-password",
        email: "test@example.com",
        fullName: "Test User",
        role: "user",
        isActive: true,
        refreshToken: "valid-refresh-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserService.findById = jest.fn().mockResolvedValue(mockUser);
      
      jest.spyOn(tokenUtils, "generateTokens").mockReturnValue({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
      
      mockUserService.saveRefreshToken = jest.fn().mockResolvedValue({
        ...mockUser,
        refreshToken: "new-refresh-token"
      });

      // Act
      const result = await authService.refreshTokens(refreshToken);

      // Assert
      expect(tokenUtils.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserService.findById).toHaveBeenCalledWith("1");
      expect(tokenUtils.generateTokens).toHaveBeenCalled();
      expect(mockUserService.saveRefreshToken).toHaveBeenCalledWith("1", "new-refresh-token");
      expect(result).toEqual({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    });

    it("should throw an error if refresh token is invalid", async () => {
      // Arrange
      const refreshToken = "invalid-refresh-token";
      jest.spyOn(tokenUtils, "verifyRefreshToken").mockReturnValue(null);

      // Act & Assert
      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow("Invalid refresh token");
      expect(tokenUtils.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserService.findById).not.toHaveBeenCalled();
    });

    it("should throw an error if user is not found", async () => {
      // Arrange
      const refreshToken = "valid-refresh-token";
      jest.spyOn(tokenUtils, "verifyRefreshToken").mockReturnValue({
        userId: "999",
        username: "nonexistent",
        role: "user",
      });
      
      mockUserService.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow("User not found");
      expect(tokenUtils.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserService.findById).toHaveBeenCalledWith("999");
      expect(tokenUtils.generateTokens).not.toHaveBeenCalled();
    });

    it("should throw an error if stored refresh token does not match", async () => {
      // Arrange
      const refreshToken = "valid-refresh-token";
      jest.spyOn(tokenUtils, "verifyRefreshToken").mockReturnValue({
        userId: "1",
        username: "testuser",
        role: "user",
      });
      
      const mockUser: User = {
        id: "1",
        username: "testuser",
        password: "hashed-password",
        email: "test@example.com",
        fullName: "Test User",
        role: "user",
        isActive: true,
        refreshToken: "different-refresh-token",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserService.findById = jest.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.refreshTokens(refreshToken)).rejects.toThrow("Invalid refresh token");
      expect(tokenUtils.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(mockUserService.findById).toHaveBeenCalledWith("1");
      expect(tokenUtils.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe("getProfile", () => {
    it("should get user profile successfully", async () => {
      // Arrange
      const mockUser: User = {
        id: "1",
        fullName: "Test User",
        username: "testuser",
        email: "test@example.com",
        password: "hashed-password",
        role: "user",
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserService.findById = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await authService.getProfile("1");

      // Assert
      expect(mockUserService.findById).toHaveBeenCalledWith("1");
      expect(result).toHaveProperty("id", "1");
      expect(result).toHaveProperty("username", "testuser");
      expect(result).not.toHaveProperty("password");
    });

    it("should throw an error if user is not found", async () => {
      // Arrange
      mockUserService.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getProfile("999")).rejects.toThrow("User not found");
      expect(mockUserService.findById).toHaveBeenCalledWith("999");
    });
  });
});