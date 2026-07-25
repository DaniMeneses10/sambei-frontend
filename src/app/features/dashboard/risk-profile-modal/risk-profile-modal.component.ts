import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { RISK_PROFILE_OPTIONS, RiskProfile, RiskProfileOption } from '../../../core/models/risk-profile.enum';

@Component({
    selector: 'app-risk-profile-modal',
    standalone: true,
    imports: [NgClass],
    templateUrl: './risk-profile-modal.component.html',
})
export class RiskProfileModalComponent implements OnInit {
    // Perfil actual (si ya tenía uno elegido, para resaltarlo al reabrir el modal para cambiarlo).
    @Input() current: RiskProfile | null = null;
    @Output() saved = new EventEmitter<RiskProfile>();
    @Output() cancel = new EventEmitter<void>();

    readonly options = RISK_PROFILE_OPTIONS;
    selected = signal<RiskProfile | null>(null);

    // El @Input llega después del constructor — inicializar el signal acá, no en el field initializer.
    ngOnInit(): void {
        this.selected.set(this.current);
    }

    select(option: RiskProfileOption): void {
        this.selected.set(option.value);
    }

    confirm(): void {
        if (this.selected() === null) return;
        this.saved.emit(this.selected()!);
    }
}
