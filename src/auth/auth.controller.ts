import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { type User } from '@prisma/client';
import { AuditAction } from 'src/common/decorators/audit-action.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuditInterceptor } from 'src/common/interceptor/audit_log.interceptor';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/auth.guard';
import { OtpService } from './otp.service';

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(AuditInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un nouveau compte utilisateur',
    description:
      "Enregistre un nouvel utilisateur avec email et mot de passe. L'email doit être unique.",
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
    schema: {
      example: {
        statusCode: 400,
        message: [
          'email must be an email',
          'password must be longer than 8 characters',
        ],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
    schema: {
      example: {
        statusCode: 409,
        message: 'Email already exists',
        error: 'Conflict',
      },
    },
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.registerUser(registerDto);
  }

  @Post('login')
  @AuditAction('LOGIN', 'User')
  @ApiOperation({
    summary: 'Se connecter',
    description: 'Authentifie un utilisateur et retourne un token JWT',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Connexion réussie',
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.loginUser(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: "Obtenir le profil de l'utilisateur connecté",
    description:
      'Retourne les informations du profil utilisateur. Nécessite un token JWT valide.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré avec succès',
    schema: {
      example: {
        id: 'uuid-1234-5678',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: '2024-01-15T10:30:00.000Z',
        updatedAt: '2024-01-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Vérifier le code OTP',
    description: 'Finalise la connexion après vérification du code 2FA',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyLoginOtp(
      verifyOtpDto.userId,
      verifyOtpDto.code,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Activer le 2FA',
    description:
      "Active l'authentification à deux facteurs et génère des codes de backup",
  })
  async enable2FA(@CurrentUser() user: any) {
    const result = await this.otpService.enable2FA(user.id);

    return {
      message: '2FA enabled successfully',
      backupCodes: result.backupCodes,
      warning:
        'Save these backup codes in a secure place. You will not see them again.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Désactiver le 2FA',
    description: "Désactive l'authentification à deux facteurs",
  })
  async disable2FA(@CurrentUser() user: any) {
    await this.otpService.disable2FA(user.id);

    return { message: '2FA disabled successfully' };
  }
}
