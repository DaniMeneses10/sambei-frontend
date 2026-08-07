import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserStatus } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = '/api/admin/users';

    getAllUsers(): Observable<UserStatus[]> {
        return this.http.get<UserStatus[]>(this.baseUrl);
    }

    updateUserStatus(userId: string, isActive: boolean, isPlus: boolean): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${userId}`, { isActive, isPlus });
    }
}
