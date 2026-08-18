import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { CreateInvestmentRequest, InvestmentDetailResponse, UpdateInvestmentRequest } from "../models/investment.models";

  @Injectable({ providedIn: 'root' })
export class InvestmentService {
    private readonly http    = inject(HttpClient);
    private readonly baseUrl = '/api/investments';

    create(request: CreateInvestmentRequest): Observable<unknown> {
        return this.http.post(this.baseUrl, request);
    }

    update(id: string, request: UpdateInvestmentRequest): Observable<unknown> {
        return this.http.put(`${this.baseUrl}/${id}`, request);
    }

    // reason: motivo opcional de la venta — el Advisor lo usa después como contexto histórico
    // (ver BuildAdvisorContextService, backend). Por query string, no por body: DELETE-con-body
    // es poco confiable (algunos proxies lo descartan) y esto es solo un texto corto.
    delete(id: string, reason?: string): Observable<void> {
        const trimmed = reason?.trim();
        const options = trimmed ? { params: { reason: trimmed } } : {};
        return this.http.delete<void>(`${this.baseUrl}/${id}`, options);
    }

    getDetail(symbol: string): Observable<InvestmentDetailResponse> {
        return this.http.get<InvestmentDetailResponse>(
            `${this.baseUrl}/${symbol}/detail`
        );
    }
}