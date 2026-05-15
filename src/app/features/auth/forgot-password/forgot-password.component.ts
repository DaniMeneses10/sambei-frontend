import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";
import { RouterLink } from "@angular/router";
import { CardComponent } from "../../../shared/card/card.component";
import { ButtonComponent } from "../../../shared/button/button.component";
import { InputComponent } from "../../../shared/input/input.component";

@Component({
    selector: 'app-forgot-password',
    imports: [ReactiveFormsModule, RouterLink, CardComponent, ButtonComponent, InputComponent],
    templateUrl: './forgot-password.component.html',
})

export class ForgotPasswordComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);

    loading = signal(false);
    submitted = signal(false);

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]]
    })

    onSubmit() {
        if(this.form.invalid) return;

        this.loading.set(true);
        
        const { email } = this.form.value;

        this.authService.forgotPassword({ email: email! })
            .subscribe({
                next: () => {
                    this.submitted.set(true);
                    this.loading.set(false);
                },
                error: () => {
                    // Mostramos éxito siempre — evita user enumeration
                      this.submitted.set(true);
                      this.loading.set(false);
                }
            })

    }
}