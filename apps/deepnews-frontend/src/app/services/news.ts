import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Article {
  id: string;
  title: string;
  link: string;
  content: string;
  summary?: string;
  keyPoints?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  readingTime?: number;
  imageUrl?: string;
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
  private baseUrl = 'http://localhost:3333/api';
  private http = inject(HttpClient);

  getNews(tag?: string, limit = 15, offset = 0, mode?: 'for-me' | 'all', search?: string, sortDate?: 'asc' | 'desc' | null, sortName?: 'asc' | 'desc' | null, timeRange: '1d' | '1w' | '1m' | '1y' | 'all' = 'all'): Observable<Article[]> {
    let params = new HttpParams().set('limit', limit).set('offset', offset);
    if (tag) {
        params = params.set('tag', tag);
    }
    if (mode) {
        params = params.set('mode', mode);
    }
    if (search) {
        params = params.set('search', search);
    }
    if (sortDate) {
        params = params.set('sortDate', sortDate);
    }
    if (sortName) {
        params = params.set('sortName', sortName);
    }
    if (timeRange) {
        params = params.set('timeRange', timeRange);
    }
    return this.http.get<Article[]>(`${this.baseUrl}/news`, { params });
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/categories`);
  }

  getUserPreferences(): Observable<{ userId: string; likedTags: string[] }> {
      return this.http.get<{ userId: string; likedTags: string[] }>(`${this.baseUrl}/user/preferences`);
  }

  saveUserPreferences(tags: string[]): Observable<any> {
      return this.http.post(`${this.baseUrl}/user/preferences`, { tags });
  }
}
