import { Component, inject, OnInit, signal } from '@angular/core';
import { AdvisorAlert, RecommendationAction } from '../../core/models/advisor.models';
import { AiAdvisorService } from '../../core/services/ai-advisor.service';

// Auto-detección (2026-08-15): "Sambei notó que compraste/vendiste X, se marcó como que le hiciste
// caso a tal recomendación". Se piden una sola vez al montar (GetPendingAdvisorAlertsQueryHandler ya
// las marca como vistas al devolverlas) — no hay polling, coincide con la cadencia de revisión de
// Daniel (entra al dashboard cada 15 días, no necesita enterarse en vivo).
@Component({
    selector: 'app-advisor-alerts',
    standalone: true,
    template: `
        @if (alerts().length > 0) {
            <div class="bg-surface-800 rounded-2xl p-4 flex flex-col gap-2 mb-4">
                <h3 class="text-white font-semibold text-sm flex items-center gap-2">
                    <span>👀</span> Sambei notó esto desde tu última visita
                </h3>
                @for (alert of alerts(); track alert.id) {
                    <div class="bg-slate-700/40 rounded-xl p-3 text-xs flex items-center justify-between gap-3">
                        <p class="text-slate-200">
                            <span [class.text-success]="alert.action === Action.Buy" [class.text-danger]="alert.action === Action.Sell" class="font-semibold">
                                {{ alert.action === Action.Buy ? 'Compraste' : 'Vendiste' }} {{ alert.symbol }}
                            </span>
                            — marcado como que le hiciste caso a esa recomendación.
                        </p>
                        <button
                            (click)="dismiss(alert.id)"
                            class="text-slate-500 hover:text-slate-300 text-[11px] underline whitespace-nowrap">
                            no fue por eso
                        </button>
                    </div>
                }
            </div>
        }
    `,
})
export class AdvisorAlertsComponent implements OnInit {
    private readonly advisorSvc = inject(AiAdvisorService);

    protected readonly Action = RecommendationAction;
    alerts = signal<AdvisorAlert[]>([]);

    ngOnInit() {
        this.advisorSvc.getPendingAlerts().subscribe({
            next: alerts => this.alerts.set(alerts),
            error: () => {}, // no crítico — si falla, simplemente no se muestra el panel
        });
    }

    dismiss(id: string) {
        // Optimista: la saca de la lista ya mismo, no hace falta esperar la respuesta para que
        // se sienta instantáneo — es una corrección de falso positivo, no una acción crítica.
        this.alerts.update(list => list.filter(a => a.id !== id));
        this.advisorSvc.dismissRecommendation(id).subscribe({ error: () => {} });
    }
}
