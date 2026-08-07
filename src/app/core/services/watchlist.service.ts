import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WatchlistCandidate } from '../models/watchlist.models';

@Injectable({ providedIn: 'root' })
export class WatchlistService {
    private readonly http = inject(HttpClient);

    getCandidates(): Observable<WatchlistCandidate[]> {
        return this.http.get<WatchlistCandidate[]>('/api/watchlist/candidates');
    }
}
