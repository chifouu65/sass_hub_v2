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
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async googleAuth(@Res() res: Response) {
    return res.redirect(this.authService.buildOAuthAuthorizeUrl('google'));
  }

  @Public()
  @Get('google/callback')
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const query = req.url.split('?')[1];
    return res.redirect(
      this.authService.buildOAuthCallbackUrl('google', query),
    );
  }

  @Public()
  @Get('github')
  async githubAuth(@Res() res: Response) {
    return res.redirect(this.authService.buildOAuthAuthorizeUrl('github'));
  }

  @Public()
  @Get('github/callback')
  async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const query = req.url.split('?')[1];
    return res.redirect(
      this.authService.buildOAuthCallbackUrl('github', query),
    );
  }

  @Public()
  @Get('microsoft')
  async microsoftAuth(@Res() res: Response) {
    return res.redirect(this.authService.buildOAuthAuthorizeUrl('microsoft'));
  }

  @Public()
  @Get('microsoft/callback')
  async microsoftAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const query = req.url.split('?')[1];
    return res.redirect(
      this.authService.buildOAuthCallbackUrl('microsoft', query),
    );
  }
}

