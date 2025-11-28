import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Article {
  id: string;
  title: string;
  link: string;
  content: string;
  summary?: string;
  source: string;
  tags: string[];
  publishedAt: Date;
}

export interface Category {
  id: string;
  label: string;
  children?: Category[];
  keywords?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private apiUrl = 'http://localhost:3333/api/news';
  private categoriesUrl = 'http://localhost:3333/api/categories';
  private http = inject(HttpClient);

  getNews(tag?: string, limit = 15, offset = 0): Observable<Article[]> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (tag) {
        params = params.set('tag', tag);
    }
    return this.http.get<Article[]>(this.apiUrl, { params });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoriesUrl);
  }
}
