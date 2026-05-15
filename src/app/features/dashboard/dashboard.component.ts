  import { Component, inject } from '@angular/core';
  import { Router } from '@angular/router';
  import { AuthService } from '../../core/services/auth.service';

  @Component({
      selector: 'app-dashboard',
      template: `
          <div class="min-h-screen bg-surface-900 flex flex-col items-center justify-center gap-6">
              <h1 class="text-4xl font-bold text-primary-500">Sambei</h1>
              <p class="text-white text-xl">¡Bienvenido al dashboard!</p>
              <p class="text-slate-400 text-sm">{{ authService.currentUser()?.email }}</p>
              <button
                  (click)="logout()"
                  class="px-4 py-2 bg-danger text-white rounded-xl text-sm hover:bg-danger/80">
                  Cerrar sesión
              </button>
          </div>
      `,
  })
  export class DashboardComponent {
      readonly authService = inject(AuthService);
      private readonly router = inject(Router);

      logout() {
          this.authService.logout();
      }
  }