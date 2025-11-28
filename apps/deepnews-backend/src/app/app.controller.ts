import { Controller, Get, Post, Body, Query, InternalServerErrorException, Logger, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './database/entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import { NewsGateway } from './news.gateway';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    private newsGateway: NewsGateway
  ) {}

  @Get('ping')
  ping() { return { status: 'pong' }; }

  @Get('test')
  getTestPage(): StreamableFile {
    let filePath = path.join(process.cwd(), 'apps/deepnews-backend/src/assets/test-news.html');
    if (!fs.existsSync(filePath)) {
        filePath = path.join(process.cwd(), 'dist/apps/deepnews-backend/assets/test-news.html');
    }
    
    if (!fs.existsSync(filePath)) {
        throw new InternalServerErrorException('Test file not found');
    }

    const file = createReadStream(filePath);
    return new StreamableFile(file, { type: 'text/html' });
  }

  @Get('news')
  async getNews(
    @Query('tag') tag?: string,
    @Query('limit') limit = 15,
    @Query('offset') offset = 0
  ) {
    try {
      let query = this.articleRepo.createQueryBuilder('article')
        .orderBy('article.publishedAt', 'DESC')
        .skip(Number(offset))
        .take(Number(limit));

      if (tag) {
        // MySQL JSON search
        query = query.where(`JSON_CONTAINS(article.tags, :tag)`, { tag: `"${tag}"` });
      }

      const articles = await query.getMany();
      return articles;
    } catch (error) {
      this.logger.error('Error fetching news', error);
      return { error: error.message, stack: error.stack };
    }
  }

  @Post('news')
  async createNews(@Body() body: CreateArticleDto) {
    try {
      const article = this.articleRepo.create({
        ...body,
        publishedAt: new Date(),
        tags: body.tags || ['manuel']
      });
      const savedArticle = await this.articleRepo.save(article);
      this.newsGateway.notifyNewArticle(savedArticle);
      return savedArticle;
    } catch (error) {
      this.logger.error('Error creating news', error);
      throw new InternalServerErrorException('Failed to create news: ' + error.message);
    }
  }

  @Get('categories')
  getCategories() {
    let taxonomyPath = '';
    try {
        taxonomyPath = path.join(process.cwd(), 'apps/deepnews-backend/src/assets/categories.json');
        
        if (!fs.existsSync(taxonomyPath)) {
            taxonomyPath = path.join(process.cwd(), 'dist/apps/deepnews-backend/assets/categories.json');
        }
        
        if (fs.existsSync(taxonomyPath)) {
            return JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
        }
        
        this.logger.warn(`Categories file not found at ${taxonomyPath}`);
        return { error: 'File not found', path: taxonomyPath };
    } catch (error) {
        this.logger.error('Error fetching categories', error);
        return { error: error.message, path: taxonomyPath };
    }
  }
}
