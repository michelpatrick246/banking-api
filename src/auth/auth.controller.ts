import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Role, type User } from '@prisma/client';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Accès administrateur',
    description:
      'Point de terminaison accessible uniquement aux administrateurs.',
  })
  @ApiResponse({
    status: 200,
    description: 'Accès administrateur accordé',
    schema: {
      example: 'Admin access granted',
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé pour les utilisateurs non administrateurs',
    schema: {
      example: {
        statusCode: 403,
        message: 'Forbidden resource',
        error: 'Forbidden',
      },
    },
  })
  testAdmin() {
    return 'Admin access granted';
  }
}
