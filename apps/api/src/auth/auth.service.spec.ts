import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.RESEARCHER,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    phone: null,
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      updateLastLogin: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };
    authService = new AuthService(usersService as UsersService, jwtService as JwtService);
  });

  it('should throw UnauthorizedException for invalid email', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.login({ email: 'wrong@example.com', password: 'password' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
