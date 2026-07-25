import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })

export class AuthService {
    private readonly http = inject(HttpClient); //Esta es la forma moderna de inyección de dependencias en Angular 17+. En lugar de:
    private readonly router = inject(Router);
    private readonly apiUrl = '/api/auth';
    private readonly TOKEN_KEY = 'sambei_token';

    // Estado reactivo — toda la app puede leer esto
    currentUser = signal<AuthResponse | null>(null);
    isAuthenticated = computed(() => this.currentUser() !== null);

    constructor() {
        // Al iniciar la app, restaura la sesión si hay token guardado
        this.restoreSession();
    }

    login(request: LoginRequest){
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request)
    }

    register(request: RegisterRequest){       
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request)
    }

    forgotPassword(request: ForgotPasswordRequest){
        return this.http.post(`${this.apiUrl}/forgot-password`, request);
    }

    resetPassword(request: ResetPasswordRequest){
        return this.http.post(`${this.apiUrl}/reset-password`, request);
    }

    saveSession(user: AuthResponse) {
        localStorage.setItem(this.TOKEN_KEY, user.token);
        this.currentUser.set(user);
    }

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/auth/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private restoreSession() {
        const token = localStorage.getItem(this.TOKEN_KEY)
        if (token) {
            // Token existe — restauramos un usuario básico para mantener la sesión activa
            this.currentUser.set({ token, email: '', expiresAt: '' });
        }
    }
}