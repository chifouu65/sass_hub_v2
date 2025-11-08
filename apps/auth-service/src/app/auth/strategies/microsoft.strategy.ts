import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Strategy pour l'authentification OAuth Microsoft
 */
@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('MICROSOFT_CLIENT_ID') || '',
      clientSecret: configService.get<string>('MICROSOFT_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('MICROSOFT_CALLBACK_URL') || 'http://localhost:3000/api/auth/microsoft/callback',
      scope: ['user.read'],
      tenant: 'common', // Permet d'authentifier tous les comptes Microsoft (personal + work/school)
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const user = {
      email: profile.mail || profile.userPrincipalName,
      firstName: profile.name?.givenName,
      lastName: profile.name?.surname,
      avatarUrl: '', // Microsoft ne fournit pas d'avatar dans le profile de base
      provider: 'microsoft',
      providerId: profile.id,
    };

    // Créer ou récupérer l'utilisateur
    const authUser = await this.authService.findOrCreateOAuthUser(user);
    done(null, authUser);
  }
}

