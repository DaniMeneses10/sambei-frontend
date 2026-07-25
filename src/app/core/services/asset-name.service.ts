import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssetType } from '../models/asset-type.enum';

@Injectable({ providedIn: 'root' })
export class AssetNameService {
    private readonly http    = inject(HttpClient);
    private readonly baseUrl = '/api/prices/name';

    // GET /api/prices/name?symbol=NU&assetType=Stock — autocompleta el campo Nombre al agregar
    // una inversión. Crypto no soportado todavía (name viene null, el backend lo maneja).
    getName(symbol: string, assetType: AssetType, providerSymbol: string | null): Observable<{ name: string | null }> {
        let url = `${this.baseUrl}?symbol=${encodeURIComponent(symbol)}&assetType=${AssetType[assetType]}`;
        if (providerSymbol) url += `&providerSymbol=${encodeURIComponent(providerSymbol)}`;
        return this.http.get<{ name: string | null }>(url);
    }
}
