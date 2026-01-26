import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import 'dotenv/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Compression
  app.use(compression());
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
    credentials: true,
  });

  app.set('trust proxy', 'loopback');
  // Sécurité - Helmet (protection headers HTTP)
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Banking API')
    .setDescription(
      'API sécurisée de gestion de comptes bancaires avec authentification JWT, transactions atomiques et virements internes',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentification et gestion des utilisateurs')
    .addTag('accounts', 'Gestion des comptes bancaires')
    .addTag(
      'transactions',
      'Gestion des transactions (dépôts, retraits, virements)',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Entrez votre token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Développement')
    .addServer(process.env.URL_PROD || '', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Banking API - Documentation',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
