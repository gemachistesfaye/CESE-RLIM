import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    try {
      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!user.isActive || (user as any).status === 'SUSPENDED') {
        throw new UnauthorizedException('Account is deactivated or suspended');
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.usersService.updateLastLogin(user.id);

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Login failed:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }
}
