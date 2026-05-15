import { Component, input, forwardRef } from "@angular/core";
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
            <input
                [type]="type()"
                [placeholder]="placeholder()"
                [disabled]="isDisabled"
                [value]="value"
                (input)="onChange($event.target.value)"
                (blur)="onTouched()"
                          class="w-full px-4 py-3 rounded-xl bg-surface-900 border border-slate-700
                 text-white placeholder-slate-500
                 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-200"/>
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

    value: string = '';
    isDisabled: boolean = false;

    onChange  = (_: any) => {};
    onTouched = () => {};

    writeValue(value: string) { this.value = value ?? ''; }
    registerOnChange(fn: any)  { this.onChange = fn; }
    registerOnTouched(fn: any) { this.onTouched = fn; }
    setDisabledState(disabled: boolean) { this.isDisabled = disabled; }
}