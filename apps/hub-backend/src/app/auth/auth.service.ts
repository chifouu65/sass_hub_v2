import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserStatus } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
    });

    const savedUser = await this.userRepository.save(user);

    // Générer les tokens
    const tokens = this.generateTokens(savedUser);

    return {
      ...tokens,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Trouver l'utilisateur
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le statut de l'utilisateur
    if (user.status !== 'active') {
      throw new UnauthorizedException('Votre compte est suspendu ou inactif');
    }

    // Générer les tokens
    const tokens = this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.status !== 'active') {
      return null;
    }

    return user;
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.validateUser(payload.sub);

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé ou inactif');
      }

      const tokens = this.generateTokens(user);

      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      };
    } catch {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const accessTokenSecret = this.configService.get<string>('jwt.secret') || 'your-super-secret-jwt-key';
    const accessTokenExpiresIn = this.configService.get<string>('jwt.expiresIn') || '24h';
    
    const refreshTokenSecret = this.configService.get<string>('jwt.refreshSecret') || 'your-super-secret-refresh-key';
    const refreshTokenExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessTokenSecret,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshTokenSecret,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
    };

    const secret = this.configService.get<string>('jwt.secret') || 'your-super-secret-jwt-key';
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '24h';

    return this.jwtService.sign(payload, {
      secret,
    });
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    // Pour la sécurité, on ne révèle pas si l'email existe ou non
    if (!user) {
      return {
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
      };
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token valide 1 heure

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await this.userRepository.save(user);

    // TODO: Envoyer un email avec le lien de réinitialisation
    // Pour l'instant, on retourne juste le token dans la réponse (à retirer en production)
    console.log(`Reset password token for ${email}: ${resetToken}`);

    return {
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
    };
  }

  /**
   * Réinitialisation de mot de passe avec token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token de réinitialisation invalide');
    }

    // Vérifier si le token n'a pas expiré
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Le token de réinitialisation a expiré');
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe et effacer le token
    user.passwordHash = passwordHash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    return {
      message: 'Votre mot de passe a été réinitialisé avec succès',
    };
  }

  /**
   * Trouver ou créer un utilisateur via OAuth
   */
  async findOrCreateOAuthUser(profile: {
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    // Chercher un utilisateur existant avec le même provider + providerId
    let user = await this.userRepository.findOne({
      where: {
        oauthProvider: profile.provider,
        oauthProviderId: profile.providerId,
      },
    });

    // Si pas trouvé, chercher par email
    if (!user) {
      user = await this.userRepository.findOne({
        where: { email: profile.email },
      });
    }

    // Si l'utilisateur existe déjà
    if (user) {
      // Mettre à jour les informations OAuth si nécessaire
      if (!user.oauthProvider || !user.oauthProviderId) {
        user.oauthProvider = profile.provider;
        user.oauthProviderId = profile.providerId;
        user.firstName = user.firstName || profile.firstName;
        user.lastName = user.lastName || profile.lastName;
        user.avatarUrl = profile.avatarUrl;
        await this.userRepository.save(user);
      }
      return user;
    }

    // Créer un nouvel utilisateur
    const newUser = this.userRepository.create({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      oauthProvider: profile.provider,
      oauthProviderId: profile.providerId,
      status: UserStatus.ACTIVE,
      // Pas de passwordHash pour les utilisateurs OAuth
    });

    return await this.userRepository.save(newUser);
  }
}

