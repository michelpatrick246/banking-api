import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OtpType, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from 'src/database/database.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService,
  ) {}

  async registerUser(registerUserDto: RegisterDto) {
    const existingUser = await this.databaseService.user.findUnique({
      where: { email: registerUserDto.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerUserDto.password, 10);

    const newUser = await this.databaseService.user.create({
      data: {
        ...registerUserDto,
        password: hashedPassword,
      },
    });

    return this.generateJwtToken(newUser);
  }

  async loginUser(loginDto: LoginDto) {
    const user = await this.databaseService.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (user.twoFactorEnabled) {
      await this.otpService.generateAndSendOtp(user.id, OtpType.LOGIN);
      return {
        requiresOtp: true,
        userId: user.id,
        message: 'Verification code sent to your email',
      };
    }

    return this.generateJwtToken(user);
  }

  private generateJwtToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  validateUser(userId: number): Promise<User | null> {
    console.log('Validating user with ID:', userId);
    return this.databaseService.user.findUnique({ where: { id: userId } });
  }

  /**
   * Vérifie l'OTP et finalise la connexion
   */
  async verifyLoginOtp(userId: number, code: string) {
    // Vérifier le code OTP
    const isValid = await this.otpService.verifyOtp(
      userId,
      code,
      OtpType.LOGIN,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.generateJwtToken(user);
  }
}
