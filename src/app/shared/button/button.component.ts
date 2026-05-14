  import { Component, input } from '@angular/core';
  import { CommonModule } from '@angular/common';

  @Component({
    selector: 'app-button',
    imports: [CommonModule],
    template: `
      <button
        [type]="type()"
        [disabled]="disabled() || loading()"
        class="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200
               bg-primary-600 hover:bg-primary-500 active:bg-primary-700
               disabled:opacity-50 disabled:cursor-not-allowed">
        @if (loading()) {
          <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Cargando...
          </span>
        } @else {
          <ng-content />
        }
      </button>
    `
  })
  export class ButtonComponent {
    type  = input<'button' | 'submit'>('button');
    loading  = input<boolean>(false);
    disabled = input<boolean>(false);
  }