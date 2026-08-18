import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
    AddPensionContributionRequest, AddPensionValuationRequest, PensionAllocationTargetRequest,
    PensionDashboard, PensionPortfolio
} from '../models/pension.models';
import { AuthService } from './auth.service';

// F12 — Skandia (2026-08-18). Módulo totalmente independiente del dashboard de ETFs/crypto: propio
// baseUrl, propios modelos, sin cruzar entidades con InvestmentService.
@Injectable({ providedIn: 'root' })
export class PensionService {
    private readonly authService = inject(AuthService);
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/pension';

    getCatalog(): Observable<PensionPortfolio[]> {
        return this.http.get<PensionPortfolio[]>(`${this.baseUrl}/catalog`);
    }

    getDashboard(): Observable<PensionDashboard> {
        return this.http.get<PensionDashboard>(`${this.baseUrl}/dashboard`);
    }

    addContribution(request: AddPensionContributionRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/contributions`, request);
    }

    addValuation(request: AddPensionValuationRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/valuations`, request);
    }

    setAllocationTargets(targets: PensionAllocationTargetRequest[]): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/allocation-targets`, { targets });
    }

    // Streaming SSE consumido a mano (fetch + ReadableStream) — mismo patrón que
    // ai-advisor.service.ts sendMessage(): HttpClient no da texto incremental sin capas extra.
    async suggestAllocation(
        monthlyContributionCop: number,
        horizonYears: number,
        riskProfileHint: string,
        onChunk: (chunk: string) => void,
        abortSignal?: AbortSignal
    ): Promise<void> {
        const res = await fetch(`${this.baseUrl}/allocation/suggest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.authService.getToken()}`,
            },
            body: JSON.stringify({ monthlyContributionCop, horizonYears, riskProfileHint }),
            signal: abortSignal,
        });

        if (!res.ok || !res.body) {
            if (res.status === 401) this.authService.logout();
            throw new Error('No se pudo conectar con el Advisor de Pensión');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() ?? '';

            for (const event of events) {
                if (!event.startsWith('data: ')) continue;
                onChunk(JSON.parse(event.slice('data: '.length)) as string);
            }
        }
    }
}
