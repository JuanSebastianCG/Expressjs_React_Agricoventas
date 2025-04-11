import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import * as tokenUtils from '../../utils/tokenUtils';
import * as passwordUtils from '../../utils/passwordUtils';

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
jest.mock('../user.service');
jest.mock('../../utils/tokenUtils');
jest.mock('../../utils/passwordUtils');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock UserService
    mockUserService = {
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      saveRefreshToken: jest.fn(),
      removeRefreshToken: jest.fn()
    } as unknown as jest.Mocked<UserService>;
    
    // Mock UserService constructor
    (UserService as jest.Mock).mockImplementation(() => mockUserService);
    
    // Create AuthService instance
    authService = new AuthService();
  });

  describe('register', () => {
    const registerData = {
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should register a new user successfully', async () => {
      // Arrange
      const mockUser: User = {
        id: '4',
        ...registerData,
        password: 'hashed-password',
        role: 'user',
        isActive: true,
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockUserService.findByUsername.mockResolvedValue(null);
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockUserService.saveRefreshToken.mockResolvedValue({...mockUser, refreshToken: 'test-refresh-token'});
      
      (tokenUtils.generateTokens as jest.Mock).mockReturnValue({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(mockUserService.findByUsername).toHaveBeenCalledWith(registerData.username);
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(registerData.email);
      expect(mockUserService.create).toHaveBeenCalledWith(registerData);
      expect(tokenUtils.generateTokens).toHaveBeenCalled();
      expect(mockUserService.saveRefreshToken).toHaveBeenCalledWith('4', 'test-refresh-token');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.tokens).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      });
    });

    // Other tests...
  });

  // Other describe blocks...
});