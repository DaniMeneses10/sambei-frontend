import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { marked } from 'marked';
import { PensionDashboard, PensionPortfolio } from '../../../core/models/pension.models';
import { PensionService } from '../../../core/services/pension.service';

// Tab "Pensión" (F12 — Skandia, 2026-08-18) — totalmente independiente del dashboard de ETFs/crypto:
// propio catálogo, propios aportes/valuaciones, propio Advisor. Gateado Admin/Plus en el dashboard
// padre, igual que Watcher — este componente asume que ya pasó ese filtro (el backend igual lo
// vuelve a exigir vía RequireAuthorization, la fuente real de verdad es el servidor).
//
// Sin API de precio de Skandia, así que a diferencia del resto de Sambei esto NO trackea P&L en
// vivo: "valor actual" es lo último que el usuario cargó a mano desde su estado de cuenta.
@Component({
    selector: 'app-pension-tab',
    standalone: true,
    imports: [ReactiveFormsModule],
    templateUrl: './pension-tab.component.html',
})
export class PensionTabComponent implements OnInit {
    private readonly pensionSvc = inject(PensionService);
    private readonly fb = inject(FormBuilder);

    catalog = signal<PensionPortfolio[]>([]);
    dashboard = signal<PensionDashboard | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);

    showCatalog = signal(false);
    showContributionForm = signal(false);
    showValuationForm = signal(false);
    showPlanEditor = signal(false);

    savingContribution = signal(false);
    savingValuation = signal(false);
    savingPlan = signal(false);
    planSaved = signal(false);

    // Plan de asignación en edición: portfolioId -> % objetivo. Se inicializa desde dashboard()
    // cada vez que se recarga, y el usuario lo edita en memoria hasta apretar "Guardar plan".
    planTargets = signal<Record<string, number>>({});
    planAddPortfolioId = signal('');

    contributionForm = this.fb.nonNullable.group({
        portfolioId: ['', Validators.required],
        amountCop: [0, [Validators.required, Validators.min(1)]],
        contributionDate: [this.today(), Validators.required],
        note: [''],
    });

    valuationForm = this.fb.nonNullable.group({
        portfolioId: ['', Validators.required],
        valueCop: [0, [Validators.required, Validators.min(0)]],
        asOfDate: [this.today(), Validators.required],
    });

    suggestForm = this.fb.nonNullable.group({
        monthlyContributionCop: [1000000, [Validators.required, Validators.min(1)]],
        horizonYears: [10, [Validators.required, Validators.min(1)]],
        riskProfileHint: ['Moderado', Validators.required],
    });

    suggestion = signal('');
    suggesting = signal(false);
    suggestError = signal<string | null>(null);
    private suggestAbort: AbortController | null = null;

    ngOnInit(): void {
        this.loadAll();
    }

    private today(): string {
        return new Date().toISOString().slice(0, 10);
    }

    loadAll(): void {
        this.loading.set(true);
        this.error.set(null);

        forkJoin({
            catalog: this.pensionSvc.getCatalog(),
            dashboard: this.pensionSvc.getDashboard(),
        }).subscribe({
            next: ({ catalog, dashboard }) => {
                this.catalog.set(catalog);
                this.dashboard.set(dashboard);

                const targets: Record<string, number> = {};
                for (const item of dashboard.items) {
                    if (item.targetPct !== null) targets[item.portfolioId] = item.targetPct;
                }
                this.planTargets.set(targets);

                this.loading.set(false);
            },
            error: () => {
                this.error.set('No se pudo cargar la información de Pensión.');
                this.loading.set(false);
            },
        });
    }

    // --- Aportes ---

    submitContribution(): void {
        if (this.contributionForm.invalid || this.savingContribution()) return;

        this.savingContribution.set(true);
        const v = this.contributionForm.getRawValue();

        this.pensionSvc.addContribution({
            portfolioId: v.portfolioId,
            amountCop: v.amountCop,
            contributionDate: new Date(v.contributionDate).toISOString(),
            note: v.note.trim() || null,
        }).subscribe({
            next: () => {
                this.savingContribution.set(false);
                this.showContributionForm.set(false);
                this.contributionForm.reset({ portfolioId: '', amountCop: 0, contributionDate: this.today(), note: '' });
                this.loadAll();
            },
            error: () => {
                this.savingContribution.set(false);
                this.error.set('No se pudo registrar el aporte.');
            },
        });
    }

    // --- Valuaciones ---

    submitValuation(): void {
        if (this.valuationForm.invalid || this.savingValuation()) return;

        this.savingValuation.set(true);
        const v = this.valuationForm.getRawValue();

        this.pensionSvc.addValuation({
            portfolioId: v.portfolioId,
            valueCop: v.valueCop,
            asOfDate: new Date(v.asOfDate).toISOString(),
        }).subscribe({
            next: () => {
                this.savingValuation.set(false);
                this.showValuationForm.set(false);
                this.valuationForm.reset({ portfolioId: '', valueCop: 0, asOfDate: this.today() });
                this.loadAll();
            },
            error: () => {
                this.savingValuation.set(false);
                this.error.set('No se pudo actualizar el valor.');
            },
        });
    }

    // --- Plan de asignación ---

    addPortfolioToPlan(): void {
        const id = this.planAddPortfolioId();
        if (!id) return;
        this.planTargets.update(t => ({ ...t, [id]: t[id] ?? 0 }));
        this.planAddPortfolioId.set('');
    }

    removeFromPlan(portfolioId: string): void {
        this.planTargets.update(t => {
            const copy = { ...t };
            delete copy[portfolioId];
            return copy;
        });
    }

    updateTarget(portfolioId: string, value: string): void {
        const num = Number(value);
        this.planTargets.update(t => ({ ...t, [portfolioId]: Number.isFinite(num) ? num : 0 }));
    }

    planEntries(): { portfolioId: string; targetPct: number }[] {
        return Object.entries(this.planTargets()).map(([portfolioId, targetPct]) => ({ portfolioId, targetPct }));
    }

    planTotalPct(): number {
        return Object.values(this.planTargets()).reduce((a, b) => a + b, 0);
    }

    savePlan(): void {
        if (this.savingPlan()) return;
        this.savingPlan.set(true);

        const targets = this.planEntries();
        this.pensionSvc.setAllocationTargets(targets).subscribe({
            next: () => {
                this.savingPlan.set(false);
                this.planSaved.set(true);
                setTimeout(() => this.planSaved.set(false), 2500);
                this.loadAll();
            },
            error: () => {
                this.savingPlan.set(false);
                this.error.set('No se pudo guardar el plan de asignación.');
            },
        });
    }

    // --- Sugerencia del Advisor (IA) ---

    async askSuggestion(): Promise<void> {
        if (this.suggestForm.invalid || this.suggesting()) return;

        this.suggestion.set('');
        this.suggestError.set(null);
        this.suggesting.set(true);
        this.suggestAbort = new AbortController();

        const v = this.suggestForm.getRawValue();

        try {
            await this.pensionSvc.suggestAllocation(
                v.monthlyContributionCop, v.horizonYears, v.riskProfileHint,
                chunk => this.suggestion.update(s => s + chunk),
                this.suggestAbort.signal
            );
        } catch (err) {
            if ((err as { name?: string })?.name !== 'AbortError') {
                this.suggestError.set('No se pudo conectar con el Advisor de Pensión.');
            }
        } finally {
            this.suggesting.set(false);
        }
    }

    renderMarkdown(content: string): string {
        return marked.parse(content, { breaks: true, async: false }) as string;
    }

    // --- Helpers de formato/lookup ---

    portfolioName(id: string): string {
        return this.catalog().find(p => p.id === id)?.name ?? id;
    }

    catalogNotInPlan(): PensionPortfolio[] {
        const inPlan = new Set(Object.keys(this.planTargets()));
        return this.catalog().filter(p => !inPlan.has(p.id));
    }

    formatCop(value: number | null): string {
        if (value === null) return '—';
        return value.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    }

    formatPercent(value: number | null): string {
        if (value === null) return '—';
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
}
