import { inject, Injectable } from "@angular/core";
import { DashboardResponse } from "../../features/dashboard/dashboard.models";
import { Observable } from "rxjs";
import { HttpClient } from "@angular/common/http";

// Servicio responsable de comunicarse con el endpoint GET /api/dashboard.
// Vive en core/services porque es una dependencia compartida (en el futuro el portfolio
// y las alertas también podrían necesitar datos del dashboard).
//
// El AuthInterceptor (auth.interceptor.ts) agrega automáticamente el header
// "Authorization: Bearer {token}" a esta request — no hay que hacerlo manualmente.
@Injectable({ providedIn: 'root'})
export class DashboardService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = 'http://localhost:5070';

    getDashboard(): Observable<DashboardResponse>{
        return this.http.get<DashboardResponse>(`${this.baseUrl}/api/dashboard`);
    }
}
