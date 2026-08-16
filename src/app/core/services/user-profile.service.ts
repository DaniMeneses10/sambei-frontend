import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RiskProfile } from '../models/risk-profile.enum';

export interface RiskProfileResponse {
    riskProfile: RiskProfile | null; // null = todavía no eligió ninguno
    targetReturnPct: number | null;  // solo con riskProfile === ObjetivoRetorno
    targetPositionCount: number | null; // cantidad máxima de posiciones que quiere sostener (2026-08-15, opcional)
}

@Injectable({ providedIn: 'root' })
export class UserProfileService {
    private readonly http    = inject(HttpClient);
    private readonly baseUrl = '/api/profile/risk';

    getRiskProfile(): Observable<RiskProfileResponse> {
        return this.http.get<RiskProfileResponse>(this.baseUrl);
    }

    setRiskProfile(riskProfile: RiskProfile, targetReturnPct?: number, targetPositionCount?: number): Observable<void> {
        return this.http.put<void>(this.baseUrl, { riskProfile, targetReturnPct, targetPositionCount });
    }
}
