import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { CardComponent } from "../../../shared/card/card.component";
import { ButtonComponent } from "../../../shared/button/button.component";
import { InputComponent } from "../../../shared/input/input.component";
import { AuthService } from "../../../core/services/auth.service";

@Component({
    selector: "app-login",
    imports: [ReactiveFormsModule, RouterLink, CardComponent, ButtonComponent, InputComponent],
    templateUrl: './login.component.html',
})

export class LoginComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    loading = signal(false);
    error = signal('');

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(4)]]
    });

    onSubmit() {
        if(this.form.invalid) return;

        this.loading.set(true);
        this.error.set('');

        const { email, password } = this.form.value;
        this.authService.login({ email: email!, password: password! })
        .subscribe({
            next: (response) => {
                this.authService.saveSession(response);
                this.router.navigate(['/dashboard']);
            },
            error: (err: HttpErrorResponse) => {
                this.error.set(
                    err.status === 401
                        ? 'Email o Contraseña Incorrectos'
                        : 'Error del servidor, intentá de nuevo en unos segundos'
                );
                this.loading.set(false);
            }
        })
    }
}