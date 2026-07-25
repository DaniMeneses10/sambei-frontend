import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CongressMemberScore } from '../models/congress-score.models';

@Injectable({ providedIn: 'root' })
export class CongressScoreService {
    private readonly http    = inject(HttpClient);
    private readonly baseUrl = '/api/congressional-trades/scores';

    // GET /api/congressional-trades/scores — puntaje 1-5 estrellas por congresista, dato global
    // (no requiere auth, mismo criterio que el resto de los trades del Congreso).
    getScores(): Observable<CongressMemberScore[]> {
        return this.http.get<CongressMemberScore[]>(this.baseUrl);
    }
}
