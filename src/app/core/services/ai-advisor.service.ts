import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdvisorAlert, AdvisorMessage } from '../models/advisor.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AiAdvisorService {
    private readonly authService = inject(AuthService);
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/ai';

    // GET /api/ai/recommendations/alerts — auto-detección (2026-08-15). A diferencia de
    // getHistory/sendMessage (streaming SSE, por eso usan fetch a mano), esto es un JSON simple —
    // usa HttpClient como el resto de los servicios del proyecto.
    getPendingAlerts(): Observable<AdvisorAlert[]> {
        return this.http.get<AdvisorAlert[]>(`${this.baseUrl}/recommendations/alerts`);
    }

    dismissRecommendation(id: string): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/recommendations/${id}/dismiss`, {});
    }

    // Este servicio usa fetch() a mano (para el streaming SSE), no HttpClient — no pasa por
    // authInterceptor, así que un 401 (token vencido) necesita el mismo logout() acá aparte.
    private handleUnauthorized(res: Response): void {
        if (res.status === 401) this.authService.logout();
    }

    // GET /api/ai/history[?symbol=VOO] — hidrata el chat al abrir la página (general o por ETF).
    async getHistory(symbol?: string): Promise<AdvisorMessage[]> {
        const url = symbol ? `${this.baseUrl}/history?symbol=${encodeURIComponent(symbol)}` : `${this.baseUrl}/history`;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${this.authService.getToken()}` },
        });
        if (!res.ok) {
            this.handleUnauthorized(res);
            throw new Error('No se pudo cargar el historial del Advisor');
        }
        return res.json();
    }

    // POST /api/ai/chat — streaming SSE consumido a mano (fetch + ReadableStream).
    // HttpClient no da texto incremental sin capas extra — igual de "sin SDK" que el backend.
    async sendMessage(question: string, onChunk: (chunk: string) => void, abortSignal?: AbortSignal, symbol?: string): Promise<void> {
        const res = await fetch(`${this.baseUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.authService.getToken()}`,
            },
            body: JSON.stringify({ question, symbol: symbol ?? null }),
            signal: abortSignal,
        });

        if (!res.ok || !res.body) {
            this.handleUnauthorized(res);
            throw new Error('No se pudo conectar con el AI Advisor');
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() ?? ''; // el último puede estar incompleto — se completa en la próxima vuelta

            for (const event of events) {
                if (!event.startsWith('data: ')) continue;
                onChunk(JSON.parse(event.slice('data: '.length)) as string);
            }
        }
    }
}
