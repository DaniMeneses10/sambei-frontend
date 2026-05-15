import { Component, inject, signal } from "@angular/core";
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";
import { Router, RouterLink } from "@angular/router";
import { CardComponent } from "../../../shared/card/card.component";
import { InputComponent } from "../../../shared/input/input.component";
import { ButtonComponent } from "../../../shared/button/button.component";

function passwordMatch(group: AbstractControl){
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, RouterLink, CardComponent, ButtonComponent, InputComponent],
    templateUrl: './register.component.html',
})

export class RegisterComponent {
    private readonly fb = inject(FormBuilder);
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    loading = signal(false);
    error = signal('');

    form = this.fb.group({
        firstName: ['', Validators.required, Validators.minLength(2)],
        lastName: ['', Validators.required, Validators.minLength(2)],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(4)]],
        confirmPassword: ['', Validators.required]
    }, { validators: passwordMatch });

    onSubmit() {
        if(this.form.invalid) return;

        this.loading.set(true);
        this.error.set('');

        const { firstName, lastName, email, password } = this.form.value;

        this.authService.register({
            firstName: firstName!,
            lastName: lastName!,
            email: email!,
            password: password!
        }).subscribe({
            next: (response) => {
                this.authService.saveSession(response);
                this.router.navigate(['/dashboard']);
            },
            error: () => {
                this.error.set('Error al registrar. Intenta de nuevo.');
                this.loading.set(false);
            }
        })
    }
}


