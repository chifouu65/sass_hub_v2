import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthServiceClient } from './auth-service.client';
import { User } from './types';

@Injectable()
export class AuthService {
  constructor(private readonly authClient: AuthServiceClient) {}

  register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authClient.register(registerDto);
  }

  login(loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authClient.login(loginDto);
  }

  refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authClient.refreshToken(refreshTokenDto);
  }

  forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authClient.forgotPassword(forgotPasswordDto);
  }

  resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authClient.resetPassword(resetPasswordDto);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.authClient.getUserById(userId);
  }

  buildOAuthAuthorizeUrl(provider: string): string {
    return this.authClient.buildOAuthAuthorizeUrl(provider);
  }

  buildOAuthCallbackUrl(provider: string, queryString?: string): string {
    return this.authClient.buildOAuthCallbackUrl(provider, queryString);
  }
}

