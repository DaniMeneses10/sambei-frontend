  import { Component } from '@angular/core';

  @Component({
    selector: 'app-card',
    template: `
      <div class="bg-surface-800 rounded-none md:rounded-2xl shadow-xl p-6 md:p-8 w-full">
        <ng-content />
      </div>
    `
  })
  export class CardComponent {}