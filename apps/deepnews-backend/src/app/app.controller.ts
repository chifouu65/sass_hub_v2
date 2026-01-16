import { Controller, Get, Post, Body, Query, InternalServerErrorException, Logger, StreamableFile, Headers, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './database/entities/article.entity';
import { UserPreference } from './database/entities/user-preference.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import { NewsGateway } from './news.gateway';

import { ScraperService } from './scraper/scraper.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    @InjectRepository(UserPreference) private prefRepo: Repository<UserPreference>,
    private newsGateway: NewsGateway,
    private scraperService: ScraperService
  ) {}

  @Post('scrape')
  async triggerScrape(@Query('topic') topic?: string) {
      const query = topic || 'latest technology news';
      this.logger.log(`Manual scrape triggered for: ${query}`);
      
      // Run in background essentially, but wait for completion for response
      await this.scraperService.scrapeTopic(query);
      
      return { status: 'success', message: `Scraped topic: ${query}` };
  }

  @Post('admin/reset-articles')
  async resetArticles() {
      this.logger.warn('Clearing all articles from database...');
      await this.articleRepo.clear();
      return { status: 'success', message: 'All articles deleted' };
  }

  private getUserIdFromHeader(authHeader: string): string | null {
      if (!authHeader) return null;
      try {
          const token = authHeader.split(' ')[1];
          if (!token) return null;
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          return JSON.parse(jsonPayload).sub; 
      } catch (e) {
          return null;
      }
  }

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
    @Query('mode') mode?: string,
    @Query('search') search?: string,
    @Query('limit') limit = 15,
    @Query('offset') offset = 0,
    @Query('sortDate') sortDate?: 'asc' | 'desc',
    @Query('sortName') sortName?: 'asc' | 'desc',
    @Query('timeRange') timeRange = 'all',
    @Headers('authorization') authHeader?: string
  ) {
    try {
      let query = this.articleRepo.createQueryBuilder('article');

      // Sorting
      let hasSort = false;
      
      if (sortDate) {
          query = query.orderBy('article.publishedAt', sortDate === 'asc' ? 'ASC' : 'DESC');
          hasSort = true;
      }

      if (sortName) {
          if (hasSort) {
              query = query.addOrderBy('article.title', sortName === 'asc' ? 'ASC' : 'DESC');
          } else {
              query = query.orderBy('article.title', sortName === 'asc' ? 'ASC' : 'DESC');
              hasSort = true;
          }
      }

      // Default Sort if none provided
      if (!hasSort) {
          query = query.orderBy('article.publishedAt', 'DESC');
      }

      // Pagination
      query = query.skip(Number(offset)).take(Number(limit));

      // Time Range Filtering
      if (timeRange && timeRange !== 'all') {
        let interval = '';
        switch (timeRange) {
          case '1d': interval = '1 DAY'; break;
          case '1w': interval = '1 WEEK'; break;
          case '1m': interval = '1 MONTH'; break;
          case '1y': interval = '1 YEAR'; break;
        }
        if (interval) {
            query = query.andWhere(`article.publishedAt >= DATE_SUB(NOW(), INTERVAL ${interval})`);
        }
      }

      if (mode === 'for-me' && authHeader) {
         // ... (auth logic remains same)
         const userId = this.getUserIdFromHeader(authHeader);
         if (userId) {
             const prefs = await this.prefRepo.findOne({ where: { userId } });
             if (prefs && prefs.likedTags && prefs.likedTags.length > 0) {
                 const conditions = prefs.likedTags.map((t, i) => `JSON_SEARCH(article.tags, 'one', :tag${i}) IS NOT NULL`).join(' OR ');
                 const params = prefs.likedTags.reduce((acc, t, i) => ({ ...acc, [`tag${i}`]: `${t}%` }), {});
                 query = query.andWhere(`(${conditions})`, params);
             }
         }
      }
      
      if (tag) {
        query = query.andWhere(`JSON_SEARCH(article.tags, 'one', :searchTag) IS NOT NULL`, { searchTag: `${tag}%` });
      }

      if (search) {
          // Case insensitive search in title, content OR tags
          query = query.andWhere(
              '(LOWER(article.title) LIKE :search OR LOWER(article.content) LIKE :search OR LOWER(CAST(article.tags AS CHAR)) LIKE :search)', 
              { search: `%${search.toLowerCase()}%` }
          );
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
  async getCategories() {
    let categories = [];
    let taxonomyPath = '';
    try {
        taxonomyPath = path.join(process.cwd(), 'apps/deepnews-backend/src/assets/categories.json');
        if (!fs.existsSync(taxonomyPath)) {
            taxonomyPath = path.join(process.cwd(), 'dist/apps/deepnews-backend/assets/categories.json');
        }
        if (fs.existsSync(taxonomyPath)) {
            categories = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
        }
    } catch (error) {
        this.logger.error('Error fetching static categories', error);
    }

    try {
        const articles = await this.articleRepo.createQueryBuilder('article')
            .select('article.tags')
            .getMany();

        const usedTags = new Set<string>();
        articles.forEach(a => {
            if (Array.isArray(a.tags)) {
                a.tags.forEach(t => usedTags.add(t.toLowerCase()));
            }
        });

        const knownIds = new Set<string>();
        const traverse = (nodes: any[]) => {
            for (const node of nodes) {
                knownIds.add(node.id.toLowerCase());
                if (node.children) traverse(node.children);
            }
        };
        traverse(categories);

        const newTags = Array.from(usedTags).filter(tag => !knownIds.has(tag));

        const findNode = (nodes: any[], id: string): any => {
            for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                    const found = findNode(node.children, id);
                    if (found) return found;
                }
            }
            return null;
        };

        newTags.forEach(tag => {
            if (tag.includes(':')) {
                const [parentId, childId] = tag.split(':');
                const parent = findNode(categories, parentId);
                
                if (parent) {
                    if (!parent.children) parent.children = [];
                    if (!parent.children.find(c => c.id === tag)) {
                         parent.children.push({
                            id: tag, 
                            label: childId.charAt(0).toUpperCase() + childId.slice(1).replace(/-/g, ' '),
                            keywords: [childId]
                        });
                    }
                }
            }
        });

        return categories;

    } catch (dbError) {
        this.logger.error('Error merging dynamic categories', dbError);
        return categories;
    }
  }
}
