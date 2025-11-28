import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Parser from 'rss-parser';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../database/entities/article.entity';
import { ClassifierService } from '../classifier/classifier.service';
import { NewsGateway } from '../news.gateway';

// Hack import
const RssParser = (Parser as any).default || Parser;

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly parser = new RssParser();

  // Sources RSS temporaires (Tech & Crypto)
  private readonly sources = [
    'https://techcrunch.com/feed/',
    'https://cointelegraph.com/rss'
  ];

  constructor(
    private classifierService: ClassifierService,
    @InjectRepository(Article) private articleRepo: Repository<Article>,
    private newsGateway: NewsGateway
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Starting ingestion process...');

    for (const source of this.sources) {
      try {
        this.logger.log(`Fetching source: ${source}`);
        const feed = await this.parser.parseURL(source);
        
        // On prend juste les 3 derniers articles pour tester
        const recentItems = feed.items.slice(0, 3);

        for (const item of recentItems) {
           // Vérifier si l'article existe déjà
           const exists = await this.articleRepo.findOne({ where: { link: item.link } });
           if (exists) {
             continue;
           }

           this.logger.log(`[New Article] ${item.title}`);
           
           // Classification IA
           const tags = await this.classifierService.classify(item.title, item.contentSnippet || item.content);
           
           this.logger.log(` -> Tags: ${JSON.stringify(tags)}`);

           // Sauvegarder en DB
           try {
             const saved = await this.articleRepo.save({
               title: item.title,
               link: item.link,
               content: item.contentSnippet || item.content || '',
               summary: '', // TODO: Générer résumé
               source: source,
               tags: tags,
               publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
             });
             this.newsGateway.notifyNewArticle(saved);
             this.logger.log(' -> Saved to DB & Broadcasted');
           } catch (dbErr) {
             this.logger.error(`Failed to save article: ${dbErr.message}`);
           }
        }

      } catch (error) {
        this.logger.error(`Failed to fetch ${source}: ${error.message}`);
      }
    }
    
    this.logger.debug('Ingestion finished.');
  }
}
