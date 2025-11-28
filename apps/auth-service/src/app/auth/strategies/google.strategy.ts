import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Strategy pour l'authentification OAuth Google
 */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    console.log(configService.get<string>('GOOGLE_CLIENT_ID'));
    console.log(configService.get<string>('GOOGLE_CLIENT_SECRET'));
    console.log(configService.get<string>('GOOGLE_CALLBACK_URL'));
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:4200/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      avatarUrl: photos[0].value,
      provider: 'google',
      providerId: profile.id,
    };

    // Créer ou récupérer l'utilisateur
    const authUser = await this.authService.findOrCreateOAuthUser(user);
    done(null, authUser);
  }
}

