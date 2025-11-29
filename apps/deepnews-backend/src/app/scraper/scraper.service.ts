import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Article } from '../database/entities/article.entity';
import { ClassifierService } from '../classifier/classifier.service';
import { NewsGateway } from '../news.gateway';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly apiKey: string;

  constructor(
    private configService: ConfigService,
    private classifierService: ClassifierService,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    private newsGateway: NewsGateway
  ) {
    this.apiKey = this.configService.get<string>('TAVILY_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('TAVILY_API_KEY is not set. Scraper will not function.');
    }
  }

  // Topics to rotate through for broader coverage
  private readonly topics = [
    'artificial intelligence breakthroughs',
    'latest crypto and bitcoin news',
    'global finance markets updates',
    'cybersecurity threats and news',
    'space exploration updates',
    'medical biotech innovations',
    'global political policy changes',
    'climate change and renewable energy news'
  ];

  private currentTopicIndex = 0;

  @Cron(CronExpression.EVERY_30_MINUTES) // Run every 30 minutes to save credits but keep fresh
  async handleCron() {
    if (!this.apiKey) {
        this.logger.warn('Skipping scrape: No API Key');
        return;
    }

    this.logger.debug('Starting Tavily ingestion process...');
    
    // Rotate topics
    const topic = this.topics[this.currentTopicIndex];
    this.currentTopicIndex = (this.currentTopicIndex + 1) % this.topics.length;

    await this.scrapeTopic(topic);
    
    this.logger.debug('Ingestion finished.');
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
                  max_results: 5
              })
          });

          const data = await response.json();
          
          if (!data.results) {
              this.logger.warn('No results from Tavily');
              return;
          }

          for (const item of data.results) {
               // Verify duplicates
               const exists = await this.articleRepo.findOne({ where: { link: item.url } });
               if (exists) continue;

               this.logger.log(`[New Article] ${item.title}`);
               
               // AI Classification
               // Tavily returns 'content' which is often the full text or a good snippet
               const tags = await this.classifierService.classify(item.title, item.content);
               this.logger.log(` -> Tags: ${JSON.stringify(tags)}`);

               try {
                 const saved = await this.articleRepo.save({
                   title: item.title,
                   link: item.url,
                   content: item.content || item.snippet || '', // Use content if available
                   summary: '', 
                   source: new URL(item.url).hostname.replace('www.', ''),
                   tags: tags,
                   publishedAt: new Date(), // Tavily doesn't always give date, assume fresh
                 });
                 this.newsGateway.notifyNewArticle(saved);
                 this.logger.log(' -> Saved & Broadcasted');
               } catch (dbErr) {
                 this.logger.error(`Failed to save article: ${dbErr.message}`);
               }
          }

      } catch (error) {
          this.logger.error(`Tavily API failed: ${error.message}`);
      }
  }
}
