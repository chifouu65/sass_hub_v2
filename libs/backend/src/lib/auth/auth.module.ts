import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AUTH_JWT_CONFIG, AuthJwtConfig } from './auth.tokens';
import { AccessTokenGuard } from './guards/access-token.guard';
import { AccessTokenStrategy } from './strategies/access-token.strategy';

type AuthModuleOptions = {
  config?: AuthJwtConfig;
};

@Global()
@Module({})
export class BackendAuthModule {
  static forRoot(options: AuthModuleOptions = {}): DynamicModule {
    const configProvider: Provider<AuthJwtConfig> = {
      provide: AUTH_JWT_CONFIG,
      useFactory: (configService: ConfigService): AuthJwtConfig => {
        if (options.config) {
          return options.config;
        }

        const secret = configService.get<string>('AUTH_JWT_SECRET');

        if (!secret) {
          throw new Error(
            'AUTH_JWT_SECRET must be defined when using BackendAuthModule without an explicit configuration.',
          );
        }

        return {
          secret,
          issuer: configService.get<string>('AUTH_JWT_ISSUER'),
          audience: configService.get<string>('AUTH_JWT_AUDIENCE'),
        };
      },
      inject: [ConfigService],
    };

    return {
      module: BackendAuthModule,
      imports: [PassportModule.register({ defaultStrategy: 'jwt' }), ConfigModule],
      providers: [configProvider, AccessTokenGuard, AccessTokenStrategy],
      exports: [PassportModule, AccessTokenGuard, AUTH_JWT_CONFIG],
    };
  }
}

