import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import jwtConfig from '../config/jwt.config';
import {
  AUTH_SERVICE_BASE_URL,
  AUTH_SERVICE_INTERNAL_API_KEY,
  AuthServiceClient,
} from './auth-service.client';

@Module({
  imports: [
    HttpModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn') ?? '24h',
        },
      }),
    }),
    ConfigModule.forFeature(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    AuthServiceClient,
    {
      provide: AUTH_SERVICE_BASE_URL,
      useFactory: () =>
        process.env.AUTH_SERVICE_URL ?? 'http://localhost:3331/api',
    },
    {
      provide: AUTH_SERVICE_INTERNAL_API_KEY,
      useFactory: () => process.env.AUTH_SERVICE_INTERNAL_API_KEY ?? null,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}

