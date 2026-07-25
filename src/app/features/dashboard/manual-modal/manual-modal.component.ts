import { Component, EventEmitter, Output, signal } from '@angular/core';

// Contenido condensado de MANUAL-USUARIO.md (raíz del repo) — mismo tono conversacional, sin
// tecnicismos, adaptado a formato acordeón en vez de un scroll largo de una vez.
@Component({
    selector: 'app-manual-modal',
    standalone: true,
    templateUrl: './manual-modal.component.html',
})
export class ManualModalComponent {
    @Output() cancel = new EventEmitter<void>();

    // null = todo cerrado. Un solo acordeón abierto a la vez, mismo criterio de "no saturar".
    openSection = signal<number | null>(null);

    toggle(index: number): void {
        this.openSection.set(this.openSection() === index ? null : index);
    }

    isOpen(index: number): boolean {
        return this.openSection() === index;
    }
}
