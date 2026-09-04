import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PortfolioCategoryGap } from '../../../core/models/portfolio-category.models';
import { PortfolioCategoryService } from '../../../core/services/portfolio-category.service';

// "¿Cuánto quiero tener en cada categoría vs. cuánto tengo REALMENTE?" (F11 Fase 2, 2026-09-04) —
// pedido explícito de Daniel: separar "tecnología" en categorías más finas (semiconductores, salud,
// finanzas...) y poder declarar un % objetivo por cada una, para que el Advisor priorice el aporte
// nuevo hacia lo que realmente falta. Solo 9 categorías por ahora — las que se pueden calcular de
// forma limpia con datos reales (ver PortfolioCategoryService en el backend); "IA"/"Emergentes"/
// "ETFs Core" quedaron afuera a propósito, necesitan un mecanismo distinto que todavía no existe.
@Component({
    selector: 'app-category-targets',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './category-targets.component.html',
})
export class CategoryTargetsComponent implements OnInit {
    private readonly categorySvc = inject(PortfolioCategoryService);

    gaps = signal<PortfolioCategoryGap[]>([]);
    editedTargets = signal<Record<string, number>>({});
    loading = signal(true);
    error = signal<string | null>(null);
    saving = signal(false);
    saved = signal(false);
    editing = signal(false);

    ngOnInit(): void {
        this.load();
    }

    private load(): void {
        this.loading.set(true);
        this.categorySvc.getGap().subscribe({
            next: (data) => {
                this.gaps.set(data);
                this.editedTargets.set(Object.fromEntries(data.map(g => [g.category, g.targetPct])));
                this.loading.set(false);
            },
            error: () => {
                this.error.set('No se pudieron cargar las categorías.');
                this.loading.set(false);
            },
        });
    }

    updateTarget(category: string, value: string): void {
        const parsed = Number(value);
        this.editedTargets.update(t => ({ ...t, [category]: isNaN(parsed) ? 0 : parsed }));
    }

    totalTarget(): number {
        return Object.values(this.editedTargets()).reduce((sum, v) => sum + v, 0);
    }

    save(): void {
        this.saving.set(true);
        this.saved.set(false);
        const targets = Object.entries(this.editedTargets()).map(([category, targetPct]) => ({ category, targetPct }));
        this.categorySvc.setTargets(targets).subscribe({
            next: () => {
                this.saving.set(false);
                this.saved.set(true);
                this.editing.set(false);
                this.load(); // refresca el gap (Current no cambia, pero así el usuario ve el Target ya guardado reflejado)
            },
            error: () => {
                this.saving.set(false);
                this.error.set('No se pudo guardar el plan de categorías.');
            },
        });
    }

    formatSigned(v: number): string {
        return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
    }
}
