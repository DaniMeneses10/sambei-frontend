import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        children: [
            {
                path: 'login',
                loadComponent: () => import ('./features/auth/login/login.component').then(m => m.LoginComponent)
            },
            {
                path: 'register',
                loadComponent: () => import ('./features/auth/register/register.component').then(m => m.RegisterComponent)
            },
            {
                path: 'forgot-password',
                loadComponent: () => import ('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
            },
            {
                path: 'reset-password',
                loadComponent: () => import ('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
            }
        ]
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'portfolio/:symbol',
        canActivate: [authGuard],
        loadComponent: () => import('./features/investment-detail/investment-detail.component').then(m => m.InvestmentDetailComponent)
    },
    {
        path: 'manual',
        canActivate: [authGuard],
        loadComponent: () => import('./features/manual/manual.component').then(m => m.ManualComponent)
    },
    {
        path: '**',
        redirectTo: '/auth/login'
    }
];
