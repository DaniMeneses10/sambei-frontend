import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PortfolioCategoryGap, PortfolioCategoryTargetRequest } from "../models/portfolio-category.models";

@Injectable({ providedIn: 'root' })
export class PortfolioCategoryService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/portfolio/categories';

    getCategories(): Observable<string[]> {
        return this.http.get<string[]>(this.baseUrl);
    }

    getGap(): Observable<PortfolioCategoryGap[]> {
        return this.http.get<PortfolioCategoryGap[]>(`${this.baseUrl}/gap`);
    }

    setTargets(targets: PortfolioCategoryTargetRequest[]): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/targets`, { targets });
    }
}
