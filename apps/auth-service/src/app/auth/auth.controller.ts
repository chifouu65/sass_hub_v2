import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  Param,
  Headers,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  // OAuth endpoints
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // La stratégie Passport gère automatiquement la redirection
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const tokens = this.authService.generateTokens(user);
    
    // Rediriger vers le frontend avec les tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Public()
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // La stratégie Passport gère automatiquement la redirection
  }

  @Public()
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const tokens = this.authService.generateTokens(user);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Public()
  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuth() {
    // La stratégie Passport gère automatiquement la redirection
  }

  @Public()
  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  async microsoftAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const tokens = this.authService.generateTokens(user);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Public()
  @Get('mock/login')
  async mockLogin(@Res() res: Response) {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    const mockUser = {
      email: 'mock.user@example.com',
      firstName: 'Mock',
      lastName: 'User',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mock',
      provider: 'mock',
      providerId: 'mock-123',
    };

    const user = await this.authService.findOrCreateOAuthUser(mockUser);
    const tokens = this.authService.generateTokens(user);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Public()
  @Get('internal/users/:id')
  async getInternalUser(
    @Param('id') id: string,
    @Headers('x-internal-api-key') apiKey?: string,
  ) {
    this.assertInternalApiKey(apiKey);

    const user = await this.authService.validateUser(id);

    if (!user) {
      throw new NotFoundException(
        `Utilisateur ${id} introuvable ou inactif`,
      );
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      createdAt: user.createdAt,
      permissions: [],
      roles: [],
    };
  }

  private assertInternalApiKey(apiKey?: string) {
    const expectedKey =
      this.configService.get<string>('AUTH_SERVICE_INTERNAL_API_KEY') ?? '';

    if (!expectedKey) {
      return;
    }

    if (apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }
  }
}

