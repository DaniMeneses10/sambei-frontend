import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NewsItem } from '../models/news.models';

@Injectable({ providedIn: 'root' })
export class NewsService {
    private readonly http    = inject(HttpClient);
    private readonly baseUrl = '/api/news';

    // GET /api/news/{symbol} — devuelve las últimas noticias guardadas en DB.
    // El backend aplica lazy init: si no hay noticias, las fetcha de Marketaux antes de devolver.
    getNews(symbol: string): Observable<NewsItem[]> {
        return this.http.get<NewsItem[]>(`${this.baseUrl}/${symbol}`);
    }
}
