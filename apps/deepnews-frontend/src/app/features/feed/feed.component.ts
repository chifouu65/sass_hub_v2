import { 
  Component, 
  OnInit, 
  inject, 
  signal, 
  ChangeDetectionStrategy,
  output
} from '@angular/core';
import { NewsService, Article, Category } from '../../services/news';
import { NewsSocket } from '../../services/socket';
import { ArticleCardComponent } from './components/article-card/article-card.component';

@Component({
  selector: 'app-infinite-trigger',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfiniteTriggerComponent implements OnInit {
  trigger = output<void>();

  ngOnInit() {
    this.trigger.emit();
  }
}

@Component({
  selector: 'app-feed',
  imports: [InfiniteTriggerComponent, ArticleCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feed.component.html'
})
export class FeedComponent implements OnInit {
  private newsService = inject(NewsService);
  private newsSocket = inject(NewsSocket);

  // Signals
  readonly articles = signal<Article[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly selectedTag = signal<string | null>(null);
  readonly loading = signal(true);
  readonly hasMore = signal(true);
  readonly isLoadingMore = signal(false);
  
  private offset = 0;
  private limit = 15;

  ngOnInit() {
    this.loadNews();
    this.loadCategories();

    this.newsSocket.onNewArticle().subscribe(article => {
        const tag = this.selectedTag();
        if (!tag || (article.tags && article.tags.includes(tag))) {
            this.articles.update(current => [article, ...current]);
        }
    });
  }

  loadNews(tag?: string | null, reset = true) {
    if (reset) {
        this.loading.set(true);
        this.offset = 0;
        this.articles.set([]);
        this.hasMore.set(true);
    } else {
        this.isLoadingMore.set(true);
    }

    const safeTag = tag === null ? undefined : tag;

    this.newsService.getNews(safeTag, this.limit, this.offset).subscribe(data => {
        if (data.length < this.limit) {
            this.hasMore.set(false);
        }
        
        if (reset) {
            this.articles.set(data);
            this.loading.set(false);
        } else {
            this.articles.update(current => [...current, ...data]);
            this.isLoadingMore.set(false);
        }
        
        this.offset += this.limit;
    });
  }

  loadMore() {
      this.loadNews(this.selectedTag(), false);
  }

  loadCategories() {
    this.newsService.getCategories().subscribe(cats => this.categories.set(cats));
  }

  filter(tag: string | null) {
    this.selectedTag.set(tag);
    this.loadNews(tag, true);
  }
}
