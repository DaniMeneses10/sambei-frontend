import { Component, input, forwardRef, signal, computed } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";

@Component({
    selector: "app-input",
    imports: [ReactiveFormsModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputComponent),
            multi: true
        }
    ],
    template: `
        <div class="flex flex-col gap-1">
            @if(label()){
                <label class="text-sm font-medium text-slate-300">
                    {{ label() }}
                </label>
            }
            <div class="relative">
                <input
                    [type]="effectiveType()"
                    [placeholder]="placeholder()"
                    [disabled]="isDisabled"
                    [value]="value"
                    (input)="onChange($event.target.value)"
                    (blur)="onTouched()"
                              class="w-full px-4 py-3 rounded-xl bg-surface-900 border border-slate-700
                     text-white placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200"
                     [class.pr-11]="type() === 'password'"/>
                @if (type() === 'password') {
                    <button
                        type="button"
                        tabindex="-1"
                        (click)="showPassword.set(!showPassword())"
                        [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        @if (showPassword()) {
                            <!-- ojo tachado — contraseña visible, click para ocultar -->
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.88 4.24A9.77 9.77 0 0112 4c5 0 9 4 10 8-.32 1.13-.87 2.2-1.6 3.14M6.1 6.1C3.9 7.5 2.3 9.6 2 12c1 4 5 8 10 8 1.55 0 3.02-.38 4.3-1.06"/>
                            </svg>
                        } @else {
                            <!-- ojo abierto — contraseña oculta, click para mostrar -->
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/>
                                <circle cx="12" cy="12" r="3" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        }
                    </button>
                }
            </div>
            @if (error()) {
                <span class="text-sm text-danger">{{ error() }}</span>
            }
        </div>
        `
})
export class InputComponent implements ControlValueAccessor {
    label = input<string>('');
    type = input<'text' | 'email' | 'password'>('text');
    placeholder = input<string>('');
    error       = input<string>('');

    // Solo aplica cuando type() es 'password' — el ojito alterna entre mostrar/ocultar el texto
    // tipeado sin cambiar el input real (sigue siendo el mismo campo, ControlValueAccessor no
    // se entera de este toggle, es puramente visual).
    showPassword = signal(false);
    effectiveType = computed(() =>
        this.type() === 'password' && this.showPassword() ? 'text' : this.type()
    );

    value: string = '';
    isDisabled: boolean = false;

    onChange  = (_: any) => {};
    onTouched = () => {};

    writeValue(value: string) { this.value = value ?? ''; }
    registerOnChange(fn: any)  { this.onChange = fn; }
    registerOnTouched(fn: any) { this.onTouched = fn; }
    setDisabledState(disabled: boolean) { this.isDisabled = disabled; }
}