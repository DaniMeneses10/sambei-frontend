import { NgClass } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { NgApexchartsModule } from "ng-apexcharts";
import { AuthService } from "../../core/services/auth.service";
import { DashboardService } from "../../core/services/dashboard.service";
import { DashboardResponse, PriceHistoryPoint } from "./dashboard.models";
import { ASSET_COLORS, MOCK_AI_SIGNALS, PERIODS } from "./mock-portfolio.data";

  @Component({
    selector: 'app-dashboard',
    imports: [NgApexchartsModule, NgClass],
    templateUrl: './dashboard.component.html',
  })
  export class DashboardComponent {
    readonly authService   = inject(AuthService);
    private readonly dashboardSvc  = inject(DashboardService);

    // Estado de carga
    loading = signal(true);
    error   = signal<string | null>(null);

    // Datos reales del backend
    dashboardData = signal<DashboardResponse | null>(null);

    // Filtros de la gráfica
    activeAssets      = signal(new Set<string>());
    showBuyPoints     = signal(true);
    showCongressional = signal(true);
    selectedPeriod    = signal('1A');

    readonly periods    = PERIODS;
    readonly assetColors = ASSET_COLORS;

    constructor() {
      // Cargar datos al iniciar el componente
      this.dashboardSvc.getDashboard().subscribe({
        next: data => {
          if (!data) {
            this.error.set('El servidor no devolvió datos. Verificá que el backend esté corriendo.');
            this.loading.set(false);
            return;
          }
          this.dashboardData.set(data);
          this.activeAssets.set(new Set(data.investments.map(i => i.symbol)));
          this.loading.set(false);
        },
        error: err => {
          this.error.set('Error al cargar el dashboard. Intentá de nuevo.');
          this.loading.set(false);
          console.error(err);
        }
      });
    }

    // Totales desde el backend
    totalValue = computed(() => this.dashboardData()?.totalCurrentValue ?? 0);
    totalProfit = computed(() => this.dashboardData()?.totalPnL ?? 0);
    totalProfitPercent = computed(() => this.dashboardData()?.totalPnLPercent ?? 0);
    isWinning = computed(() => this.totalProfit() >= 0);

    get positions() {
      return (this.dashboardData()?.investments ?? []).map(inv => ({
        symbol:           inv.symbol,
        name:             inv.name,
        broker:           'XTB',
        volume:           inv.quantity,
        openPrice:        inv.buyPrice,
        currentPrice:     inv.currentPrice,
        value:            inv.currentValue,
        netProfit:        inv.pnL,
        netProfitPercent: inv.pnLPercent
      }));
    }

    readonly aiSignals = MOCK_AI_SIGNALS;

    signalColor(signal: string): string {
      return ({ BUY: '#22c55e', HOLD: '#0ea5e9', CAUTION: '#f59e0b' } as Record<string, string>)[signal] ?? '#94a3b8';
    }

    signalIcon(signal: string): string {
      return ({ BUY: '▲', HOLD: '●', CAUTION: '▼' } as Record<string, string>)[signal] ?? '●';
    }

    signalLabel(signal: string): string {
      return ({ BUY: 'COMPRAR', HOLD: 'MANTENER', CAUTION: 'PRECAUCIÓN' } as Record<string, string>)[signal] ?? signal;
    }

    // Series de la gráfica con datos reales
    chartSeries = computed(() => {
      const data = this.dashboardData();
      if (!data) return [];

      const active = this.activeAssets();

      return data.investments
        .filter(inv => active.has(inv.symbol))
        .map(inv => ({
          name: inv.symbol,
          data: this.filterByPeriod(inv.history, this.selectedPeriod())
            .map(pt => ({ x: pt.date, y: pt.returnPercent }))
        }));
    });

    // Colores alineados con las series activas
    chartColors = computed(() => {
      const data = this.dashboardData();
      if (!data) return [];
      const active = this.activeAssets();
      return data.investments
        .filter(inv => active.has(inv.symbol))
        .map(inv => ASSET_COLORS[inv.symbol] ?? '#94a3b8');
    });

    // Annotations (puntos de compra + trades del congreso)
    chartAnnotations = computed(() => {
      const data = this.dashboardData();
      if (!data) return { points: [], xaxis: [], yaxis: [] };

      const xaxis: any[] = [];
      const active = this.activeAssets();

      // Punto de compra — línea vertical en la fecha de compra
      if (this.showBuyPoints()) {
        data.investments.filter(inv => active.has(inv.symbol)).forEach(inv => {
          const buyDate   = inv.purchaseDate.substring(0, 10);
          const filtered  = this.filterByPeriod(inv.history, this.selectedPeriod());
          const isVisible = filtered.some(pt => pt.date >= buyDate);
          const color     = ASSET_COLORS[inv.symbol] ?? '#94a3b8';

          if (isVisible) {
            xaxis.push({
              x: buyDate,
              borderColor: color,
              borderWidth: 2,
              strokeDashArray: 0,
              label: {
                borderColor: color,
                offsetY: -5,
                text: `▲ Compré ${inv.symbol} a ${this.formatUSD(inv.buyPrice)}`,
                style: { color: '#fff', background: color, fontSize: '9px',
                         padding: { left: 4, right: 4, top: 2, bottom: 2 } }
              }
            });
          }
        });
      }

      // Trades del Congreso (vacío hasta F6)
      if (this.showCongressional()) {
        data.congressionalTrades.filter(t => active.has(t.symbol)).forEach(t => {
          const action   = t.action === 'BUY' ? 'COMPRÓ' : 'VENDIÓ';
          const lastName = t.member.split(' ')[1];
          const color    = ASSET_COLORS[t.symbol] ?? '#94a3b8';
          xaxis.push({
            x: t.date,
            borderColor: color,
            borderWidth: 1,
            strokeDashArray: 4,
            label: {
              borderColor: color,
              text: `★ ${lastName} ${action} ${t.symbol} · ${t.amount}`,
              style: { color: '#fff', background: color, fontSize: '9px',
                       padding: { left: 4, right: 4, top: 2, bottom: 2 } }
            }
          });
        });
      }

      const yaxis = [{
        y: 0,
        borderColor: '#475569',
        borderWidth: 1,
        strokeDashArray: 3,
        label: {
          borderColor: 'transparent',
          text: 'Tu precio de compra',
          position: 'left',
          style: { color: '#64748b', background: 'transparent', fontSize: '10px' }
        }
      }];

      return { points: [], xaxis, yaxis };
    });

    readonly chartConfig = {
      chart: { type: 'line' as const, height: 300, background: 'transparent',
               toolbar: { show: false }, zoom: { enabled: false } },
      stroke: { curve: 'smooth' as const, width: 2 },
      xaxis: { type: 'category' as const,
               labels: { style: { colors: '#64748b', fontSize: '11px' } },
               axisBorder: { color: '#334155' }, axisTicks: { color: '#334155' } },
      yaxis: {
        title: { text: 'Rendimiento (%)', style: { color: '#475569', fontSize: '10px', fontWeight: 400 } },
        labels: { style: { colors: '#64748b', fontSize: '11px' },
                  formatter: (val: number) => `${val.toFixed(1)}%` }
      },
      grid:    { borderColor: '#1e293b', strokeDashArray: 4 },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => `${val.toFixed(2)}%` } },
      legend:  { show: false },
      theme:   { mode: 'dark' as const }
    };

    private filterByPeriod(history: PriceHistoryPoint[], period: string): PriceHistoryPoint[] {
      const days = { '1M': 30, '3M': 90, '6M': 180, '1A': 365 }[period] ?? 365;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().substring(0, 10);
      return history.filter(pt => pt.date >= cutoffStr);
    }

    toggleAsset(symbol: string) {
      this.activeAssets.update(set => {
        const next = new Set(set);
        next.has(symbol) ? next.delete(symbol) : next.add(symbol);
        return next;
      });
    }

    isAssetActive(symbol: string): boolean {
      return this.activeAssets().has(symbol);
    }

    formatUSD(value: number): string {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    formatPercent(value: number): string {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }

    logout() {
      this.authService.logout();
    }
  }