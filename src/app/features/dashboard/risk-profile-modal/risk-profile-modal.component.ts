import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { RISK_PROFILE_OPTIONS, RiskProfile, RiskProfileOption } from '../../../core/models/risk-profile.enum';

export interface RiskProfileSaveEvent {
    riskProfile: RiskProfile;
    targetReturnPct?: number;
}

@Component({
    selector: 'app-risk-profile-modal',
    standalone: true,
    imports: [NgClass, FormsModule],
    templateUrl: './risk-profile-modal.component.html',
})
export class RiskProfileModalComponent implements OnInit {
    // Perfil actual (si ya tenía uno elegido, para resaltarlo al reabrir el modal para cambiarlo).
    @Input() current: RiskProfile | null = null;
    @Input() currentTargetReturnPct: number | null = null;
    @Output() saved = new EventEmitter<RiskProfileSaveEvent>();
    @Output() cancel = new EventEmitter<void>();

    readonly options = RISK_PROFILE_OPTIONS;
    readonly ObjetivoRetorno = RiskProfile.ObjetivoRetorno;
    selected = signal<RiskProfile | null>(null);
    targetReturnPct = signal<number | null>(null);

    // El @Input llega después del constructor — inicializar el signal acá, no en el field initializer.
    ngOnInit(): void {
        this.selected.set(this.current);
        this.targetReturnPct.set(this.currentTargetReturnPct);
    }

    select(option: RiskProfileOption): void {
        this.selected.set(option.value);
    }

    get isValid(): boolean {
        if (this.selected() === null) return false;
        if (this.selected() === RiskProfile.ObjetivoRetorno) {
            const target = this.targetReturnPct();
            return target !== null && target > 0;
        }
        return true;
    }

    confirm(): void {
        if (!this.isValid) return;
        this.saved.emit({
            riskProfile: this.selected()!,
            targetReturnPct: this.selected() === RiskProfile.ObjetivoRetorno ? this.targetReturnPct()! : undefined,
        });
    }
}
