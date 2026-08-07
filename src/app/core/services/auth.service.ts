import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, UserStatus } from '../models/auth.models';

@Injectable({ providedIn: 'root' })

export class AuthService {
    private readonly http = inject(HttpClient); //Esta es la forma moderna de inyección de dependencias en Angular 17+. En lugar de:
    private readonly router = inject(Router);
    private readonly apiUrl = '/api/auth';
    private readonly TOKEN_KEY = 'sambei_token';

    // Estado reactivo — toda la app puede leer esto
    currentUser = signal<AuthResponse | null>(null);
    isAuthenticated = computed(() => this.currentUser() !== null);

    // isAdmin/isPlus gatean los tabs Watcher/Admin del dashboard — se piden frescos a la DB
    // (GET /api/auth/me), nunca se confía en un claim embebido en el JWT (puede durar 24hs).
    userStatus = signal<UserStatus | null>(null);
    isAdmin = computed(() => this.userStatus()?.isAdmin ?? false);
    isPlus = computed(() => this.userStatus()?.isPlus ?? false);

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
        this.refreshUserStatus();
    }

    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        this.currentUser.set(null);
        this.userStatus.set(null);
        this.router.navigate(['/auth/login']);
    }

    // Se llama después de login/register y al restaurar sesión — nunca se cachea entre reloads,
    // así un cambio de isActive/isAdmin/isPlus hecho por un admin se refleja apenas el usuario
    // recarga la página (no hay que esperar a que venza el JWT).
    async refreshUserStatus(): Promise<void> {
        try {
            const status = await firstValueFrom(this.http.get<UserStatus>(`${this.apiUrl}/me`));
            this.userStatus.set(status);
        } catch {
            this.userStatus.set(null);
        }
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    private restoreSession() {
        const token = localStorage.getItem(this.TOKEN_KEY)
        if (!token) return;

        // Bug real (2026-07-27): esto restauraba la sesión sin chequear si el token ya había
        // vencido — la app se mostraba "logueada" pero cada request al backend daba 401 en
        // silencio. El síntoma: el usuario escribía preguntas al AI Advisor que nunca llegaban
        // a guardarse (el middleware de auth corta el request ANTES de tocar el handler), así
        // que al recargar parecía que "los mensajes se borraban" — nunca habían existido.
        const payload = this.decodeToken(token);
        if (!payload || payload.exp * 1000 < Date.now()) {
            localStorage.removeItem(this.TOKEN_KEY);
            return;
        }

        // Token existe y sigue vigente — restauramos el usuario real desde el payload del JWT
        // (antes quedaba email: '' hardcodeado, así que el navbar se veía en blanco tras cada reload)
        this.currentUser.set({
            token,
            email: payload.email ?? '',
            expiresAt: new Date(payload.exp * 1000).toISOString(),
        });

        // Bug real (2026-08-07): llamar refreshUserStatus() (dispara this.http.get) directo acá
        // explotaba con NG0200 (dependencia circular) — authInterceptor hace inject(AuthService)
        // para leer el token, pero AuthService todavía se está construyendo (estamos dentro de su
        // propio constructor). queueMicrotask corre esto recién después de que el constructor
        // termine y Angular termine de registrar la instancia — mismo patrón que "diferir al
        // próximo tick" en cualquier ciclo de inicialización circular.
        queueMicrotask(() => this.refreshUserStatus());
    }

    private decodeToken(token: string): { exp: number; email?: string } | null {
        try {
            return JSON.parse(atob(token.split('.')[1]));
        } catch {
            return null; // token ilegible — tratarlo como inválido
        }
    }
}