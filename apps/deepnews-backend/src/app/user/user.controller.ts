import { Controller, Get, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from '../database/entities/user-preference.entity';

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    @InjectRepository(UserPreference) private prefRepo: Repository<UserPreference>
  ) {}

  private getUserIdFromHeader(authHeader: string): string {
      if (!authHeader) throw new UnauthorizedException('No token provided');
      const token = authHeader.split(' ')[1];
      if (!token) throw new UnauthorizedException('Invalid token format');
      
      try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          const payload = JSON.parse(jsonPayload);
          return payload.sub; 
      } catch (e) {
          throw new UnauthorizedException('Invalid token payload');
      }
  }

  @Get('preferences')
  async getPreferences(@Headers('authorization') authHeader: string) {
    const userId = this.getUserIdFromHeader(authHeader);
    const prefs = await this.prefRepo.findOne({ where: { userId } });
    return prefs || { userId, likedTags: [] };
  }

  @Post('preferences')
  async savePreferences(@Headers('authorization') authHeader: string, @Body() body: { tags: string[] }) {
    const userId = this.getUserIdFromHeader(authHeader);
    
    let prefs = await this.prefRepo.findOne({ where: { userId } });
    if (!prefs) {
        prefs = this.prefRepo.create({ userId, likedTags: body.tags });
    } else {
        prefs.likedTags = body.tags;
    }
    
    return this.prefRepo.save(prefs);
  }
}

