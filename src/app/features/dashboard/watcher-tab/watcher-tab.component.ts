import { Component, OnInit, inject, signal } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CandidateGrowthPoint, WatchlistCandidate } from '../../../core/models/watchlist.models';
import { WatchlistService } from '../../../core/services/watchlist.service';

// Tab "Watcher" (2026-08-07) — activos que el usuario NO tiene en su portfolio, rankeados por el
// mismo pool que ya usa el AI Advisor (congresistas + institucionales con buen historial + CAGR
// real). Gateado a Admin/Plus del lado del backend (403 si no corresponde) — este componente solo
// se monta cuando el tab ya está habilitado en el dashboard, pero el backend es la fuente real de
// verdad de la autorización.
@Component({
    selector: 'app-watcher-tab',
    standalone: true,
    imports: [NgApexchartsModule],
    templateUrl: './watcher-tab.component.html',
})
export class WatcherTabComponent implements OnInit {
    private readonly watchlistSvc = inject(WatchlistService);

    candidates = signal<WatchlistCandidate[]>([]);
    loading = signal(true);
    error = signal<string | null>(null);

    readonly chartConfig = {
        chart: { type: 'line' as const, height: 160, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, sparkline: { enabled: false } },
        stroke: { curve: 'smooth' as const, width: 2 },
        xaxis: { type: 'category' as const, labels: { show: false }, axisTicks: { show: false }, axisBorder: { show: false } },
        yaxis: { labels: { style: { colors: '#64748b', fontSize: '10px' }, formatter: (v: number) => v != null ? v.toFixed(0) : '' } },
        grid: { borderColor: '#1e293b', strokeDashArray: 4 },
        tooltip: { theme: 'dark' as const },
        legend: { show: false },
        theme: { mode: 'dark' as const },
        colors: ['#0ea5e9'],
    };

    ngOnInit(): void {
        this.watchlistSvc.getCandidates().subscribe({
            next: (data) => {
                this.candidates.set(data);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('No se pudieron cargar los candidatos del Watcher.');
                this.loading.set(false);
            },
        });
    }

    seriesFor(c: WatchlistCandidate) {
        return [{ name: c.symbol, data: c.priceHistory.map(p => ({ x: p.date, y: p.close })) }];
    }

    // El horizonte más largo disponible (1/3/5 años) — el más representativo para "cómo viene
    // creciendo" a simple vista de una card.
    bestGrowth(c: WatchlistCandidate): CandidateGrowthPoint | null {
        if (c.growth.length === 0) return null;
        return c.growth.reduce((a, b) => (b.requestedYears > a.requestedYears ? b : a));
    }

    formatUSD(v: number): string {
        return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
    }

    formatPercent(v: number): string {
        return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
    }
}
