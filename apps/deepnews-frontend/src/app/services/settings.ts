import { inject, Injectable, signal } from "@angular/core";
import { Category, NewsService } from "./news";
import { ModalRef } from "@sass-hub-v2/ui-kit";
import { PreferencesComponent } from "../features/preferences/preferences.component";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
  })
  export class SettingsService {

    private newsService = inject(NewsService);

   readonly categories = signal<Category[]>([]);
   readonly selectedTags = signal<Set<string>>(new Set());
  readonly saving = signal(false);

  readonly update = new Subject<void>();

   init() {
    this.newsService.getCategories().subscribe(cats => {
        this.categories.set(cats);
        
        this.newsService.getUserPreferences().subscribe({
            next: (prefs) => {
                if (prefs && prefs.likedTags) {
                    this.selectedTags.set(new Set(prefs.likedTags));
                }
                this.update.next();
            },
        });
    });
  }

  save(modalRef: ModalRef<PreferencesComponent>) {
    this.saving.set(true);
    this.newsService.saveUserPreferences(Array.from(this.selectedTags())).subscribe({
        next: () => {
            this.saving.set(false);
            modalRef.close();
            this.update.next();
        },
        error: (err) => {
            console.error('Failed to save prefs', err);
            this.saving.set(false);
        }
    });
  }
  }