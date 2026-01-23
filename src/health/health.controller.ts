import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
    HealthCheck,
    HealthCheckService,
    PrismaHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseService } from 'src/database/database.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: DatabaseService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Vérification de l'état de l'API" })
  @ApiResponse({
    status: 200,
    description: 'API opérationnelle',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
        },
        details: {
          database: { status: 'up' },
        },
      },
    },
  })
  check() {
    return this.health.check([
      () =>
        this.prismaHealth.pingCheck('database', this.prisma, {
          timeout: 3000,
        }),
    ]);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  ready() {
    return { status: 'ready', timestamp: new Date().toISOString() };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }
}
