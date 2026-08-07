import { NgClass } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserStatus } from '../../../core/models/auth.models';

// Tab "Usuarios" (2026-08-07) — solo Admin. Activar/desactivar corta el acceso real en el próximo
// request (middleware de IsActive en el backend, no algo cosmético) — otorgar Plus habilita el tab
// Watcher para ese usuario, sin billing todavía (el admin lo hace a mano).
@Component({
    selector: 'app-admin-users-tab',
    standalone: true,
    imports: [NgClass],
    templateUrl: './admin-users-tab.component.html',
})
export class AdminUsersTabComponent implements OnInit {
    private readonly adminSvc = inject(AdminService);
    private readonly authSvc = inject(AuthService);

    users = signal<UserStatus[]>([]);
    loading = signal(true);
    error = signal<string | null>(null);
    savingUserId = signal<string | null>(null);

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.loading.set(true);
        this.adminSvc.getAllUsers().subscribe({
            next: (data) => {
                this.users.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('No se pudo cargar la lista de usuarios.');
                this.loading.set(false);
            },
        });
    }

    isSelf(u: UserStatus): boolean {
        return u.userId === this.authSvc.userStatus()?.userId;
    }

    toggleActive(u: UserStatus): void {
        if (this.isSelf(u)) return; // el backend también lo bloquea — esto evita el viaje al 400
        this.updateStatus(u, !u.isActive, u.isPlus);
    }

    togglePlus(u: UserStatus): void {
        this.updateStatus(u, u.isActive, !u.isPlus);
    }

    private updateStatus(u: UserStatus, isActive: boolean, isPlus: boolean): void {
        this.savingUserId.set(u.userId);
        this.adminSvc.updateUserStatus(u.userId, isActive, isPlus).subscribe({
            next: () => {
                this.users.update(list => list.map(x => x.userId === u.userId ? { ...x, isActive, isPlus } : x));
                this.savingUserId.set(null);
            },
            error: () => {
                this.error.set('No se pudo actualizar el usuario.');
                this.savingUserId.set(null);
            },
        });
    }
}
