import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Strategy pour l'authentification OAuth GitHub
 */
@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:4200/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: Function,
  ): Promise<any> {
    const emails = profile.emails || [];
    const user = {
      email: emails[0]?.value || profile.username || `${profile.id}@github.local`,
      firstName: profile.displayName?.split(' ')[0] || profile.username,
      lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
      avatarUrl: profile.photos?.[0]?.value || '',
      provider: 'github',
      providerId: profile.id.toString(),
    };

    // Créer ou récupérer l'utilisateur
    const authUser = await this.authService.findOrCreateOAuthUser(user);
    done(null, authUser);
  }
}

