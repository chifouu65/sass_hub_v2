import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { UserController } from './user/user.controller';
import { AppService } from './app.service';
import { ScraperService } from './scraper/scraper.service';
import { ClassifierService } from './classifier/classifier.service';
import { NewsGateway } from './news.gateway';
import { Article } from './database/entities/article.entity';
import { UserPreference } from './database/entities/user-preference.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'hub_user',
      password: process.env.DB_PASSWORD || 'hub_password',
      database: process.env.DEEPNEWS_DB_NAME || 'deepnews_db',
      entities: [Article, UserPreference],
      synchronize: true,
      autoLoadEntities: true,
      logging: true,
    }),
    TypeOrmModule.forFeature([Article, UserPreference]),
  ],
  controllers: [AppController, UserController],
  providers: [AppService, ScraperService, ClassifierService, NewsGateway],
})
export class AppModule {}
