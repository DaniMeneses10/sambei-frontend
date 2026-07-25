 import { NgClass } from '@angular/common';
  import { Component, computed, inject, signal } from '@angular/core';
  import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
  import { ActivatedRoute, Router } from '@angular/router';
  import { NgApexchartsModule } from 'ng-apexcharts';
  import { InvestmentService } from '../../core/services/investment.service';
  import { InvestmentDetailResponse, PurchaseEvent, CreateInvestmentRequest } from '../../core/models/investment.models';
  import { CongressionalTrade } from '../dashboard/dashboard.models';
  import { CongressMemberScore } from '../../core/models/congress-score.models';
  import { CongressScoreService } from '../../core/services/congress-score.service';
  import { getAssetColor } from '../dashboard/mock-portfolio.data';
  import { AiAdvisorChatComponent } from '../ai-advisor/ai-advisor-chat.component';

  @Component({
    selector: 'app-investment-detail',
    standalone: true,
    imports: [NgApexchartsModule, NgClass, ReactiveFormsModule, AiAdvisorChatComponent],
    templateUrl: './investment-detail.component.html',
  })
  export class InvestmentDetailComponent {
    private readonly route     = inject(ActivatedRoute);
    private readonly router    = inject(Router);
    private readonly investSvc = inject(InvestmentService);
    private readonly congressScoreSvc = inject(CongressScoreService);
    private readonly fb        = inject(FormBuilder);

    private readonly symbol = this.route.snapshot.paramMap.get('symbol')!;

    loading = signal(true);
    error   = signal<string | null>(null);
    data    = signal<InvestmentDetailResponse | null>(null);

    getColor(symbol: string): string {
      return getAssetColor(symbol);
    }
    // 'Todo' por default: las compras reales suelen ser más viejas que 1 año — con cualquier otro
    // período por default, la barra de "fecha de compra" cae fuera de la ventana visible y no se ve.
    selectedPeriod   = signal('Todo');
    readonly periods = ['1M', '3M', '6M', '1A', 'Todo'];

    showBuyPoints     = signal(true);
    // Tooltip flotante al hover sobre una anotación de trade del Congreso — mismo mecanismo a mano
    // que el dashboard (ApexCharts no soporta tooltip nativo en anotaciones xaxis).
    hoveredCongressTrade = signal<{ trade: CongressionalTrade; x: number; y: number } | null>(null);

    // Puntaje 1-5 estrellas por congresista + filtro — mismo mecanismo que el dashboard.
    congressScores      = signal<CongressMemberScore[]>([]);
    activePoliticians   = signal(new Set<string>());
    showPoliticianMenu  = signal(false);
    politicianSearch    = signal('');

    // Modal de edición de un lote puntual — null = cerrado
    purchaseToEdit = signal<PurchaseEvent | null>(null);
    editForm = this.fb.group({
      quantity:     [null as number | null, [Validators.required, Validators.min(0.000001)]],
      buyPrice:     [null as number | null, [Validators.required, Validators.min(0.000001)]],
      purchaseDate: ['', Validators.required],
      broker:       ['', Validators.required]
    });
    editSaving = signal(false);
    editError  = signal('');

    // "Agregar otra compra" — a diferencia del modal "Agregar inversión" del dashboard, acá ya
    // estamos parados dentro de ESTE item: Nombre/Symbol/ProviderSymbol/AssetType/Broker ya se
    // conocen (vienen del propio detalle) y no se le vuelven a pedir al usuario, solo lo que
    // cambia de una compra a otra (cantidad, precio, fecha).
    showAddPurchase = signal(false);
    addForm = this.fb.group({
      quantity:     [null as number | null, [Validators.required, Validators.min(0.000001)]],
      buyPrice:     [null as number | null, [Validators.required, Validators.min(0.000001)]],
      purchaseDate: ['', Validators.required],
      broker:       ['', Validators.required]
    });
    addSaving = signal(false);
    addError  = signal('');

    constructor() {
      this.loadDetail();

      // Puntajes de congresistas — independiente del detalle, no bloquea su carga si tarda o falla.
      this.congressScoreSvc.getScores().subscribe({
        next: scores => this.congressScores.set(scores),
        error: () => {}
      });
    }

    private loadDetail() {
      this.loading.set(true);
      this.investSvc.getDetail(this.symbol).subscribe({
        next: d => {
          this.data.set(d);
          // Arranca vacío a propósito — con todos los congresistas marcados de entrada la gráfica
          // se satura (acá ni siquiera hay ventana de fecha, se trae el histórico completo).
          this.activePoliticians.set(new Set());
          this.loading.set(false);
        },
        error: () => { this.error.set('No se pudo cargar el detalle.'); this.loading.set(false); }
      });
    }

    // Lista de congresistas para el dropdown, mismo criterio que el dashboard: ordenados de mejor a
    // peor puntaje, los sin puntaje todavía al final.
    politicianOptions = computed(() => {
      const d = this.data();
      if (!d) return [];

      const scoreByName = new Map(this.congressScores().map(s => [s.politicianName, s]));
      const names = [...new Set(d.congressionalTrades.map(t => t.member))];

      return names
        .map(name => ({ name, score: scoreByName.get(name) ?? null }))
        .sort((a, b) => {
          const starsA = a.score?.starRating ?? 0;
          const starsB = b.score?.starRating ?? 0;
          return starsB - starsA || a.name.localeCompare(b.name);
        });
    });

    filteredPoliticianOptions = computed(() => {
      const query = this.politicianSearch().trim().toLowerCase();
      if (!query) return this.politicianOptions();
      return this.politicianOptions().filter(o => o.name.toLowerCase().includes(query));
    });

    togglePolitician(name: string): void {
      this.activePoliticians.update(set => {
        const next = new Set(set);
        next.has(name) ? next.delete(name) : next.add(name);
        return next;
      });
    }

    isPoliticianActive(name: string): boolean {
      return this.activePoliticians().has(name);
    }

    selectAllPoliticians(): void {
      this.activePoliticians.set(new Set(this.politicianOptions().map(o => o.name)));
    }

    selectNonePoliticians(): void {
      this.activePoliticians.set(new Set());
    }

    starsLabel(starRating: number | null): string {
      if (starRating === null) return 'sin evaluar';
      return '★'.repeat(starRating) + '☆'.repeat(5 - starRating);
    }

    chartSeries = computed(() => {
      const d = this.data();
      if (!d) return [];
      return [{
        name: d.symbol,
        data: this.filterByPeriod(d.history, this.selectedPeriod())
                  .map(pt => ({ x: new Date(pt.date + 'T00:00:00').getTime(), y: pt.returnPercent }))
      }];
    });

    private filterByPeriod(history: any[], period: string): any[] {
      const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
      if (period === 'Todo') return sorted;

      const days = ({ '1M': 30, '3M': 90, '6M': 180, '1A': 365 } as Record<string, number>)[period] ?? 365;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().substring(0, 10);
      return sorted.filter(pt => pt.date >= cutoffStr);
    }

    chartColors = computed(() => {
      const d = this.data();
      if (!d) return ['#0ea5e9'];
      return [getAssetColor(d.symbol)];
    });

    // Dos tipos de barra vertical, iguales al dashboard: "▲ Compré" (una por lote, puede haber
    // varias si se compró el mismo activo más de una vez) y "★ Congresista" (trades reales,
    // House Clerk oficial). "▲ Compré" con showBuyPoints, "★ Congresista" con el dropdown de filtro
    // por congresista (activePoliticians) — vacío = ninguno visible, mismo efecto que un toggle.
    chartAnnotations = computed(() => {
      const d = this.data();
      if (!d) return { xaxis: [] };

      // "▲ Compré" siempre en azul fijo — independiente del color del activo (que ya identifica la
      // línea del gráfico) — para que la marca de compra se reconozca igual en cualquier item.
      const buyColor = '#3b82f6';
      const filtered = this.filterByPeriod(d.history, this.selectedPeriod());
      const xaxis: any[] = [];

      if (this.showBuyPoints()) {
        d.purchases
          .filter(p => {
            const buyDate = p.date.substring(0, 10);
            return filtered.some(pt => pt.date >= buyDate);
          })
          .forEach(p => xaxis.push({
            x: new Date(p.date.substring(0, 10) + 'T00:00:00').getTime(),
            borderColor: buyColor,
            borderWidth: 2,
            strokeDashArray: 0,
            label: {
              borderColor: buyColor,
              offsetY: -5,
              text: `▲ ${p.quantity} @ ${this.formatUSD(p.price)}`,
              style: { color: '#fff', background: buyColor, fontSize: '9px',
                       padding: { left: 4, right: 4, top: 2, bottom: 2 } }
            }
          }));
      }

      // El toggle "mostrar/ocultar todos" (showCongressional) se sacó — el dropdown "⭐ Filtrar
      // congresistas" con "Seleccionar todos"/"Desmarcar todos" ya cubre lo mismo.
      {
        const activePols = this.activePoliticians();
        d.congressionalTrades
          .filter(t => activePols.has(t.member) && filtered.some(pt => pt.date >= t.date.substring(0, 10)))
          .forEach(t => {
            const action = t.action === 'BUY' ? 'COMPRÓ' : 'VENDIÓ';
            const lastName = t.member.split(' ')[1] ?? t.member;
            // Color por acción, no fijo: verde compra / rojo venta — mismo criterio que el dashboard.
            const color = t.action === 'BUY' ? '#22c55e' : '#ef4444';
            xaxis.push({
              x: new Date(t.date).getTime(),
              borderColor: color,
              borderWidth: 1,
              strokeDashArray: 4,
              label: {
                borderColor: color,
                text: `★ ${lastName} ${action} · ${t.amount}`,
                style: { color: '#fff', background: color, fontSize: '9px',
                         padding: { left: 4, right: 4, top: 2, bottom: 2 } },
                mouseEnter: (_annotation: unknown, e: MouseEvent) =>
                  this.hoveredCongressTrade.set({ trade: t, x: e.clientX, y: e.clientY }),
                mouseLeave: () => this.hoveredCongressTrade.set(null)
              }
            });
          });
      }

      return { xaxis };
    });

    readonly chartConfig = {
      chart:   { type: 'line' as const, height: 300, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
      stroke:  { curve: 'smooth' as const, width: 2 },
      xaxis: { type: 'category' as const, axisBorder: { color: '#334155' }, axisTicks: { color: '#334155' } },
      yaxis:   { labels: { style: { colors: '#64748b', fontSize: '11px' }, formatter: (val: number) => val != null ? `${val.toFixed(1)}%` : '' } },
      grid:    { borderColor: '#1e293b', strokeDashArray: 4 },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => val != null ? `${val.toFixed(2)}%` : '' } },
      legend:  { show: false },
      theme:   { mode: 'dark' as const }
    };

    isWinning = computed(() => (this.data()?.pnLPercent ?? 0) >= 0);

    chartXAxis = computed(() => {
      const period = this.selectedPeriod();
      const max = new Date();

      if (period === 'Todo') {
        const history = this.data()?.history ?? [];
        const earliest = history.length
          ? [...history].sort((a, b) => a.date.localeCompare(b.date))[0].date
          : null;
        const min = earliest ? new Date(earliest + 'T00:00:00') : new Date(max.getFullYear() - 5, max.getMonth(), max.getDate());
        return this.buildXAxis(min, max);
      }

      const days = ({ '1M': 30, '3M': 90, '6M': 180, '1A': 365 } as Record<string, number>)[period] ?? 365;
      const min = new Date();
      min.setDate(min.getDate() - days);
      return this.buildXAxis(min, max);
    });

    private buildXAxis(min: Date, max: Date) {
      return {
        type: 'datetime' as const,
        min: min.getTime(),
        max: max.getTime(),
        labels: { style: { colors: '#64748b', fontSize: '11px' }, datetimeUTC: false },
        axisBorder: { color: '#334155' },
        axisTicks:  { color: '#334155' }
      };
    }

    formatUSD(v: number)     { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v); }
    formatPercent(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`; }
    formatDate(d: string)    { return new Date(d).toLocaleDateString('es-AR', { year: 'numeric', month: 'short', day: 'numeric' }); }
    formatNewsDate(d: string) {
      const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
      return h < 24 ? `hace ${h}h` : `hace ${Math.floor(h / 24)}d`;
    }
    formatTradeDate(isoDate: string): string {
      return new Date(isoDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    }
    tradeActionLabel(action: string): string {
      return action === 'BUY' ? 'Compró' : 'Vendió';
    }

    // Un lote por vez, con el aporte de esa compra puntual al P&L total (usa el precio actual
    // compartido del símbolo — no hace falta pedirlo de nuevo por lote).
    purchasePnL(p: PurchaseEvent) {
      const currentPrice = this.data()?.currentPrice ?? p.price;
      const currentValue = p.quantity * currentPrice;
      const invested = p.quantity * p.price;
      const pnl = currentValue - invested;
      const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
      return { currentValue, invested, pnl, pnlPercent };
    }

    openEdit(p: PurchaseEvent) {
      this.editError.set('');
      this.editForm.setValue({
        quantity: p.quantity,
        buyPrice: p.price,
        purchaseDate: p.date.substring(0, 10),
        broker: p.broker
      });
      this.purchaseToEdit.set(p);
    }

    cancelEdit() {
      this.purchaseToEdit.set(null);
    }

    saveEdit() {
      const p = this.purchaseToEdit();
      if (!p || this.editForm.invalid) return;

      this.editSaving.set(true);
      this.editError.set('');

      const v = this.editForm.value;
      this.investSvc.update(p.id, {
        quantity: v.quantity!,
        buyPrice: v.buyPrice!,
        purchaseDate: new Date(v.purchaseDate!).toISOString(),
        broker: v.broker!
      }).subscribe({
        next: () => {
          this.editSaving.set(false);
          this.purchaseToEdit.set(null);
          this.loadDetail(); // recalcula agregados (costo promedio, P&L, barras) con el dato nuevo
        },
        error: () => {
          this.editError.set('Error al guardar. Verificá los datos.');
          this.editSaving.set(false);
        }
      });
    }

    openAddPurchase() {
      this.addError.set('');
      this.addForm.reset();
      // Precargado con el broker de este item pero editable — la mayoría de las compras DCA
      // son con el mismo broker de siempre, pero no todas (ej. cambio de plataforma).
      this.addForm.patchValue({ broker: this.data()?.broker ?? '' });
      this.showAddPurchase.set(true);
    }

    cancelAddPurchase() {
      this.showAddPurchase.set(false);
    }

    saveAddPurchase() {
      const d = this.data();
      if (!d || this.addForm.invalid) return;

      this.addSaving.set(true);
      this.addError.set('');

      const v = this.addForm.value;
      const request: CreateInvestmentRequest = {
        name: d.name,
        symbol: d.symbol,
        providerSymbol: d.providerSymbol,
        assetType: d.assetType,
        broker: v.broker!,
        quantity: v.quantity!,
        buyPrice: v.buyPrice!,
        purchaseDate: new Date(v.purchaseDate!).toISOString()
      };

      this.investSvc.create(request).subscribe({
        next: () => {
          this.addSaving.set(false);
          this.showAddPurchase.set(false);
          this.loadDetail(); // recalcula agregados (costo promedio, P&L, barras) con el lote nuevo
        },
        error: () => {
          this.addError.set('Error al guardar. Verificá los datos.');
          this.addSaving.set(false);
        }
      });
    }

    goBack() { this.router.navigate(['/dashboard']); }
  }
