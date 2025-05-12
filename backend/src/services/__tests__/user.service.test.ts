import { UserService } from '../../services/user.service';
import * as passwordUtils from '../../utils/passwordUtils';

// Define mock data first
const mockUsers = [
  {
    id: '1',
    fullName: 'Admin User',
    username: 'admin',
    email: 'admin@example.com',
    password: 'hashed-password',
    role: 'admin',
    isActive: true,
    refreshToken: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: '2',
    fullName: 'Regular User',
    username: 'user',
    email: 'user@example.com',
    password: 'hashed-password',
    role: 'user',
    isActive: true,
    refreshToken: null,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }
];

// Create mock Prisma client
const mockPrismaClient = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
};

// Mock the @prisma/client module
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient)
  };
});

// Mock passwordUtils
jest.mock('../../utils/passwordUtils');

describe('UserService Comprehensive Tests', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  describe('findAll', () => {
    it('should return all users as SafeUser objects', async () => {
      // Arrange
      mockPrismaClient.user.findMany.mockResolvedValue([...mockUsers]);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(mockPrismaClient.user.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[0]).not.toHaveProperty('refreshToken');
      expect(result[0]).toHaveProperty('id', '1');
      expect(result[1]).toHaveProperty('id', '2');
    });

    it('should return empty array when no users exist', async () => {
      // Arrange
      mockPrismaClient.user.findMany.mockResolvedValue([]);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(mockPrismaClient.user.findMany).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle database errors during findAll', async () => {
      // Arrange
      const dbError = new Error('Database connection error');
      mockPrismaClient.user.findMany.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.findAll()).rejects.toThrow(dbError);
      expect(mockPrismaClient.user.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return a user by ID', async () => {
      // Arrange
      const userId = '1';
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUsers[0]);

      // Act
      const result = await userService.findById(userId);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(result).toEqual(mockUsers[0]);
    });

    it('should return null if user not found', async () => {
      // Arrange
      const userId = '999';
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findById(userId);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(result).toBeNull();
    });

    it('should handle database errors during findById', async () => {
      // Arrange
      const userId = '1';
      const dbError = new Error('Database connection error');
      mockPrismaClient.user.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(userService.findById(userId)).rejects.toThrow(dbError);
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalled();
    });
  });

  describe('findByUsername', () => {
    it('should return a user by username', async () => {
      // Arrange
      const username = 'admin';
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUsers[0]);

      // Act
      const result = await userService.findByUsername(username);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { username }
      });
      expect(result).toEqual(mockUsers[0]);
    });

    it('should return null if username not found', async () => {
      // Arrange
      const username = 'nonexistent';
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findByUsername(username);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { username }
      });
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      // Arrange
      const email = 'admin@example.com';
      mockPrismaClient.user.findUnique.mockResolvedValue(mockUsers[0]);

      // Act
      const result = await userService.findByEmail(email);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email }
      });
      expect(result).toEqual(mockUsers[0]);
    });

    it('should return null if email not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      mockPrismaClient.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userService.findByEmail(email);

      // Assert
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { email }
      });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Arrange
      const userData = {
        fullName: 'New User',
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!'
      };
      
      const hashedPassword = 'hashed-password';
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      
      const mockCreatedUser = {
        id: '3',
        fullName: 'New User',
        username: 'newuser',
        email: 'new@example.com',
        password: hashedPassword,
        role: 'user',
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockPrismaClient.user.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userService.create(userData);

      // Assert
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fullName: userData.fullName,
          username: userData.username,
          email: userData.email,
          password: hashedPassword
        })
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create a user with default role if not specified', async () => {
      // Arrange
      const userData = {
        fullName: 'New User',
        username: 'newuser',
        email: 'new@example.com',
        password: 'Password123!'
      };
      
      const hashedPassword = 'hashed-password';
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      
      mockPrismaClient.user.create.mockImplementation((params) => {
        return Promise.resolve({
          id: '3',
          ...params.data,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });

      // Act
      const result = await userService.create(userData);

      // Assert
      expect(mockPrismaClient.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'user' // Default role
        })
      });
      expect(result.role).toBe('user');
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      // Arrange
      const userId = '1';
      const updateData = {
        fullName: 'Updated Name',
        email: 'updated@example.com'
      };
      
      const mockUpdatedUser = {
        ...mockUsers[0],
        fullName: 'Updated Name',
        email: 'updated@example.com',
        updatedAt: new Date()
      };
      
      mockPrismaClient.user.update.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await userService.update(userId, updateData);

      // Assert
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should hash password when updating password', async () => {
      // Arrange
      const userId = '1';
      const updateData = {
        password: 'NewPassword123!'
      };
      
      const hashedPassword = 'new-hashed-password';
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue(hashedPassword);
      
      const mockUpdatedUser = {
        ...mockUsers[0],
        password: hashedPassword,
        updatedAt: new Date()
      };
      
      mockPrismaClient.user.update.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await userService.update(userId, updateData);

      // Assert
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith(updateData.password);
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: hashedPassword }
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle non-existent user during update', async () => {
      // Arrange
      const userId = '999';
      const updateData = {
        fullName: 'Updated Name'
      };
      
      const notFoundError = new Error('User not found');
      mockPrismaClient.user.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(userService.update(userId, updateData)).rejects.toThrow(notFoundError);
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      // Arrange
      const userId = '1';
      mockPrismaClient.user.delete.mockResolvedValue(mockUsers[0]);

      // Act
      const result = await userService.delete(userId);

      // Assert
      expect(mockPrismaClient.user.delete).toHaveBeenCalledWith({
        where: { id: userId }
      });
      expect(result).toEqual(mockUsers[0]);
    });

    it('should handle non-existent user during delete', async () => {
      // Arrange
      const userId = '999';
      const notFoundError = new Error('User not found');
      mockPrismaClient.user.delete.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(userService.delete(userId)).rejects.toThrow(notFoundError);
    });
  });

  describe('saveRefreshToken', () => {
    it('should save refresh token for a user', async () => {
      // Arrange
      const userId = '1';
      const refreshToken = 'refresh-token-123';
      
      const mockUpdatedUser = {
        ...mockUsers[0],
        refreshToken,
        updatedAt: new Date()
      };
      
      mockPrismaClient.user.update.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await userService.saveRefreshToken(userId, refreshToken);

      // Assert
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken }
      });
      expect(result).toEqual(mockUpdatedUser);
      expect(result.refreshToken).toBe(refreshToken);
    });

    it('should handle non-existent user when saving refresh token', async () => {
      // Arrange
      const userId = '999';
      const refreshToken = 'refresh-token-123';
      
      const notFoundError = new Error('User not found');
      mockPrismaClient.user.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(userService.saveRefreshToken(userId, refreshToken)).rejects.toThrow(notFoundError);
    });
  });

  describe('removeRefreshToken', () => {
    it('should remove refresh token from a user', async () => {
      // Arrange
      const userId = '1';
      
      const mockUpdatedUser = {
        ...mockUsers[0],
        refreshToken: null,
        updatedAt: new Date()
      };
      
      mockPrismaClient.user.update.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await userService.removeRefreshToken(userId);

      // Assert
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: null }
      });
      expect(result).toEqual(mockUpdatedUser);
      expect(result.refreshToken).toBeNull();
    });

    it('should handle non-existent user when removing refresh token', async () => {
      // Arrange
      const userId = '999';
      
      const notFoundError = new Error('User not found');
      mockPrismaClient.user.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(userService.removeRefreshToken(userId)).rejects.toThrow(notFoundError);
    });
  });
});