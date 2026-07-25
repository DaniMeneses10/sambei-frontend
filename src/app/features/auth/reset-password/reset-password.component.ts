import { Component, inject, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { CardComponent } from "../../../shared/card/card.component";
import { ButtonComponent } from "../../../shared/button/button.component";
import { InputComponent } from "../../../shared/input/input.component";

function passwordMatch(group: AbstractControl) {
    const password = group.get('newPassword')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
    selector: 'app-reset-password',
    imports: [ReactiveFormsModule, RouterLink, CardComponent, ButtonComponent, InputComponent],
    templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);

    // El link del email trae email+token por query params — sin esto el form no tiene con qué pegarle al backend.
    private readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
    private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

    loading = signal(false);
    error = signal('');
    success = signal(false);

    form = this.fb.group({
        newPassword: ['', [Validators.required, Validators.minLength(4)]],
        confirmPassword: ['', Validators.required]
    }, { validators: passwordMatch });

    onSubmit() {
        if (this.form.invalid) return;

        this.loading.set(true);
        this.error.set('');

        const { newPassword } = this.form.value;

        this.authService.resetPassword({
            email: this.email,
            token: this.token,
            newPassword: newPassword!
        }).subscribe({
            next: () => {
                this.success.set(true);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('El link expiró o no es válido. Pedí uno nuevo.');
                this.loading.set(false);
            }
        });
    }
}
