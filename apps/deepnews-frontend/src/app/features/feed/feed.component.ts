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
import { RouterModule, Router } from '@angular/router';
import { ModalService, SearchTableToolbarComponent } from '@sass-hub-v2/ui-kit';
import { PreferencesComponent } from '../preferences/preferences.component';
import { firstValueFrom } from 'rxjs';
import { SettingsService } from '../../services/settings';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ArticleDetailModalComponent } from './components/article-detail-modal/article-detail-modal.component';

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
  imports: [
    InfiniteTriggerComponent,
    ArticleCardComponent,
    RouterModule,
    FormsModule,
    SearchTableToolbarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './feed.component.html'
})
export class FeedComponent implements OnInit {
  private newsService = inject(NewsService);
  private newsSocket = inject(NewsSocket);
  private router = inject(Router);
  private modalService = inject(ModalService);
  private settingsService = inject(SettingsService);


  // Signals
  readonly articles = signal<Article[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly selectedTag = signal<string | null>(null);
  readonly searchQuery = signal<string>('');
  readonly loading = signal(true);
  readonly hasMore = signal(true);
  readonly isLoadingMore = signal(false);
  
  // Filter Signals
  readonly sortDate = signal<'asc' | 'desc' | null>('desc');
  readonly sortName = signal<'asc' | 'desc' | null>(null);
  readonly currentTimeRange = signal<'1d' | '1w' | '1m' | '1y' | 'all'>('all');
  readonly showScrollTop = signal(false);

  private searchSubject = new Subject<string>();
  
  // Local State
  private userPrefs = new Set<string>();
  private offset = 0;
  private limit = 15;

  ngOnInit() {
    // Scroll Listener
    window.addEventListener('scroll', () => {
        this.showScrollTop.set(window.scrollY > window.innerHeight * 1.2);
    });

    this.settingsService.init();

    this.settingsService.update.subscribe(() => {
        this.getUserPreferences();
    });

    this.newsSocket.onNewArticle().subscribe(article => {
        // Add new article to the top of the list without full reload
        this.articles.update(current => [article, ...current]);
        // Optionally reload categories if tags changed
        this.loadCategories();
    });
    
    // Setup search debounce
    this.searchSubject.pipe(
        debounceTime(400),
        distinctUntilChanged()
    ).subscribe(query => {
        this.searchQuery.set(query);
        this.loadNews(this.selectedTag(), true);
    });
    
    // Initial load
    this.getUserPreferences();
  }
  
  onSearchInput(event: Event) {
      const value = (event.target as HTMLInputElement).value;
      this.searchSubject.next(value);
  }

  onSearchValueChange(value: string) {
      this.searchSubject.next(value);
  }
  
  openArticle($event: Article) {
      this.modalService.open(ArticleDetailModalComponent, {
          data: $event,
          host: {
              title: null,
              showCloseButton: true,
              closeOnBackdrop: true
          }
      });
  }
  
  getUserPreferences() {
    this.newsService.getUserPreferences().subscribe({
        next: (prefs) => {
            console.log('User Prefs received:', prefs);
            if (prefs && prefs.likedTags) {
                this.userPrefs = new Set(prefs.likedTags);
            }
            console.log('User Prefs Size:', this.userPrefs.size);

            if (this.userPrefs.size === 0) {
                console.log('No prefs, opening onboarding modal');
                this.openPreferences(true);
            } else {
                console.log('Prefs found, loading news');
                this.loadNews();
                this.loadCategories();
            }
        },
        error: (err) => {
            console.error('Error loading prefs:', err);
            this.loadNews();
            this.loadCategories();
        }
    });
  }

  async openPreferences(isOnboarding = false) {
      console.log('Opening Preferences Modal. Onboarding:', isOnboarding);
      try {
          const ref = this.modalService.open(PreferencesComponent, {
              host: { 
                  title: isOnboarding ? 'Bienvenue sur DeepNews AI 🧠' : 'Mes Préférences',
                  showCloseButton: !isOnboarding,
                  closeOnBackdrop: !isOnboarding
              }
          });
          console.log('Modal opened, ref:', ref);
          
          const saved = await firstValueFrom(ref.afterClosed());
          console.log('Modal closed, result:', saved);
          
          if (saved) {
              // Reload prefs and content
              this.loading.set(true);
              this.newsService.getUserPreferences().subscribe(prefs => {
                 if (prefs && prefs.likedTags) {
                    this.userPrefs = new Set(prefs.likedTags);
                 }
                 this.loadCategories();
                 this.loadNews(null, true);
              });
          }
      } catch (e) {
          console.error('Error opening modal:', e);
      }
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
    // Force 'for-me' mode
    const safeMode = 'for-me';
    const search = this.searchQuery() || undefined;
    
    this.newsService.getNews(safeTag, this.limit, this.offset, safeMode, search, this.sortDate(), this.sortName(), this.currentTimeRange()).subscribe(data => {
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

  setSortDate(sort: 'asc' | 'desc' | 'null') {
    this.sortDate.set(sort === 'null' ? null : sort);
    this.loadNews(this.selectedTag(), true);
  }

  setSortName(sort: 'asc' | 'desc' | 'null') {
    this.sortName.set(sort === 'null' ? null : sort);
    this.loadNews(this.selectedTag(), true);
  }

  setTimeRange(range: '1d' | '1w' | '1m' | '1y' | 'all') {
    this.currentTimeRange.set(range);
    this.loadNews(this.selectedTag(), true);
  }

  loadCategories() {
    this.newsService.getCategories().subscribe(allCats => {
        // Always filter based on prefs
        if (this.userPrefs.size > 0) {
            const filteredCats: Category[] = [];
            
            allCats.forEach(cat => {
                const isParentLiked = this.userPrefs.has(cat.id);
                const likedChildren = cat.children?.filter(child => this.userPrefs.has(child.id)) || [];
                
                if (isParentLiked) {
                    filteredCats.push(cat); 
                } else if (likedChildren.length > 0) {
                    const clone = { ...cat, children: likedChildren };
                    filteredCats.push(clone);
                }
            });
            
            this.categories.set(filteredCats);
        } else {
            this.categories.set(allCats);
        }
    });
  }

  filter(tag: string | null) {
    this.selectedTag.set(tag);
    this.loadNews(tag, true);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
