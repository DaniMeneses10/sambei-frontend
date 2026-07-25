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

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    getDetail(symbol: string): Observable<InvestmentDetailResponse> {
        return this.http.get<InvestmentDetailResponse>(
            `${this.baseUrl}/${symbol}/detail`
        );
    }
}