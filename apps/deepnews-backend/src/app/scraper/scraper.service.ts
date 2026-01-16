import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Article } from '../database/entities/article.entity';
import { ClassifierService } from '../classifier/classifier.service';
import { NewsGateway } from '../news.gateway';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly apiKey: string;
  private categories: any[] = [];
  private currentTopicIndex = 0;

  constructor(
    private configService: ConfigService,
    private classifierService: ClassifierService,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    private newsGateway: NewsGateway
  ) {
    this.apiKey = this.configService.get<string>('TAVILY_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('TAVILY_API_KEY is not set. Scraper will not function.');
    } else {
      this.logger.log('TAVILY_API_KEY is set. Scraper will function.', this.apiKey);
    }
    
    this.loadCategories();
  }

  private loadCategories() {
      try {
          let taxonomyPath = path.join(process.cwd(), 'apps/deepnews-backend/src/assets/categories.json');
          if (!fs.existsSync(taxonomyPath)) {
              taxonomyPath = path.join(process.cwd(), 'dist/apps/deepnews-backend/assets/categories.json');
          }
          if (fs.existsSync(taxonomyPath)) {
              this.categories = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));
              this.logger.log(`Loaded ${this.categories.length} categories for scraping rotation.`);
          }
      } catch (error) {
          this.logger.error('Error loading categories for scraper', error);
      }
  }

  //EVERY_5_MINUTES
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    if (!this.apiKey) {
        this.logger.warn('Skipping scrape: No API Key');
        return;
    }
    
    if (this.categories.length === 0) {
        this.logger.warn('No categories loaded to scrape.');
        return;
    }

    this.logger.debug('Starting Full Tavily ingestion process (All Categories)...');
    
    // Iterate over ALL categories
    for (const category of this.categories) {
        // "breaking news" + category helps finding recent stuff
        const query = `breaking news ${category.label} last hour`;
        this.logger.log(`Processing category: ${category.label}`);
        
        // We await each scrape to avoid flooding the API rate limits instantly
        await this.scrapeTopic(query);
    }
    
    this.logger.debug('Full Ingestion finished.');
  }

  private async filterCandidates(data: any): Promise<any[]> {
      // 1. Filter exact URL matches AND old news
      const candidates = [];
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24h window

      for (const item of data.results) {
           // Check Date if available
           if (item.published_date) {
               const pubDate = new Date(item.published_date);
               // If valid date and older than 24h, skip
               if (!isNaN(pubDate.getTime()) && pubDate < oneDayAgo) {
                   this.logger.debug(`Skipping old article (${item.published_date}): ${item.title}`);
                   continue;
               }
           }

           const exists = await this.articleRepo.findOne({ where: { link: item.url } });
           if (!exists) {
               candidates.push(item);
           }
      }
      return candidates;
  }

  private async processCandidates(candidates: any[]) {
      if (candidates.length === 0) return;

      // 2. Semantic Deduplication with GPT (Smart)
      // Fetch recent history to compare against
      const history = await this.articleRepo.find({
          order: { createdAt: 'DESC' },
          take: 20,
          select: ['title', 'link']
      });

      // Ask GPT which ones are truly new
      let uniqueIndices: number[] = [];
      try {
          uniqueIndices = await this.classifierService.filterDuplicates(
              candidates.map(c => ({ title: c.title, url: c.url })),
              history.map(h => ({ title: h.title, url: h.link }))
          );
      } catch (e) {
          this.logger.warn('Deduplication error, processing all candidates', e);
          uniqueIndices = candidates.map((_, i) => i);
      }

      this.logger.log(`Deduplication: ${candidates.length} candidates -> ${uniqueIndices.length} unique articles to process.`);
      
      // Wait a bit after deduplication to let Rate Limit cool down
      await new Promise(resolve => setTimeout(resolve, 2000));

      for (const index of uniqueIndices) {
           const item = candidates[index];
           if (!item) continue;

           this.logger.log(`[New Article] ${item.title}`);
           
           // AI Classification & Analysis
           const analysis = await this.classifierService.classify(item.title, item.content);
           this.logger.log(` -> Analysis: ${JSON.stringify(analysis.tags)}`);

           try {
             const saved = await this.articleRepo.save({
               title: item.title,
               link: item.url,
               content: analysis.htmlContent || item.content || '', 
               summary: analysis.summary,
               keyPoints: analysis.keyPoints,
               sentiment: analysis.sentiment,
               readingTime: analysis.readingTime,
               source: new URL(item.url).hostname.replace('www.', ''),
               tags: analysis.tags,
               imageUrl: item.image_url || null,
               publishedAt: item.published_date ? new Date(item.published_date) : new Date(),
             });
             this.newsGateway.notifyNewArticle(saved);
             this.logger.log(' -> Saved & Broadcasted');
           } catch (dbErr) {
             this.logger.error(`Failed to save article: ${dbErr.message}`);
           }

           // RATE LIMIT PROTECTION: Wait 2s between each article processing
           await new Promise(resolve => setTimeout(resolve, 2000));
      }
  }

  async scrapeTopic(query: string) {
      this.logger.log(`Searching Tavily for: ${query}`);
      
      try {
          const response = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
                     body: JSON.stringify({
                         api_key: this.apiKey,
                         query: query,
                         search_depth: "advanced",
                         include_images: true,
                         include_answer: true, // Ask Tavily to try to answer/summarize better
                         max_results: 5
                     })
          });

          const data = await response.json();
          
          if (!data.results) {
              this.logger.warn('No results from Tavily');
              return;
          }

          const candidates = await this.filterCandidates(data);
          await this.processCandidates(candidates);

      } catch (error) {
          this.logger.error(`Tavily API failed: ${error.message}`);
      }
  }
}