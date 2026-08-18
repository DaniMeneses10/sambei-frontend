import { NgClass } from "@angular/common";
import { Component, computed, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { NgApexchartsModule } from "ng-apexcharts";
import { forkJoin } from "rxjs";
import { NewsItem } from "../../core/models/news.models";
import { CongressMemberScore } from "../../core/models/congress-score.models";
import { RiskProfile, RISK_PROFILE_OPTIONS } from "../../core/models/risk-profile.enum";
import { AuthService } from "../../core/services/auth.service";
import { CongressScoreService } from "../../core/services/congress-score.service";
import { DashboardService } from "../../core/services/dashboard.service";
import { InvestmentService } from "../../core/services/investment.service";
import { NewsService } from "../../core/services/news.service";
import { UserProfileService } from "../../core/services/user-profile.service";
import { CongressionalTrade, DashboardResponse, InstitutionalMove, PriceHistoryPoint } from "./dashboard.models";
import { buildAssetColorMap, institutionDisplayName, PERIODS } from "./mock-portfolio.data";
import { AddInvestmentComponent } from "./add-investment/add-investment.component";
import { AiAdvisorChatComponent } from "../ai-advisor/ai-advisor-chat.component";
import { AdvisorAlertsComponent } from "../ai-advisor/advisor-alerts.component";
import { RiskProfileModalComponent, RiskProfileSaveEvent } from "./risk-profile-modal/risk-profile-modal.component";
import { WatcherTabComponent } from "./watcher-tab/watcher-tab.component";
import { AdminUsersTabComponent } from "./admin-users-tab/admin-users-tab.component";

  @Component({
    selector: 'app-dashboard',
    imports: [NgApexchartsModule, NgClass, RouterLink, AddInvestmentComponent, AiAdvisorChatComponent, AdvisorAlertsComponent, RiskProfileModalComponent, WatcherTabComponent, AdminUsersTabComponent],
    templateUrl: './dashboard.component.html',
  })
  export class DashboardComponent {
    readonly authService          = inject(AuthService);
    private readonly dashboardSvc = inject(DashboardService);
    private readonly investSvc    = inject(InvestmentService);
    private readonly newsSvc      = inject(NewsService);
    private readonly congressScoreSvc = inject(CongressScoreService);
    private readonly profileSvc   = inject(UserProfileService);
    private readonly router       = inject(Router);

    // Estado de carga
    loading = signal(true);
    error   = signal<string | null>(null);
    allNews = signal<NewsItem[]>([]); // Noticias de todos los activos del portfolio
    
    dashboardData = signal<DashboardResponse | null>(null);// Datos reales del backend
    showAddForm       = signal(false);
    // null = modal cerrado | objeto = modal de confirmación abierto para esa inversión
    investmentToDelete = signal<{ id: string; name: string; symbol: string } | null>(null);
    // Motivo opcional de venta — viaja al backend en investSvc.delete() (soft delete, ver Investment.MarkAsSold)
    deleteReason = signal('');

    // Filtros de la gráfica
    activeAssets      = signal(new Set<string>());
    selectedPeriod    = signal('1A');

    // Puntaje 1-5 estrellas por congresista (calculado con historial real, ver
    // CalculateCongressMemberScoresCommandHandler) + filtro de qué congresistas mostrar en el
    // gráfico. activePoliticians arranca vacío A PROPÓSITO y se queda así — con todos marcados de
    // entrada la gráfica se satura (a diferencia de activeAssets, que sí arranca con todos).
    congressScores     = signal<CongressMemberScore[]>([]);
    activePoliticians  = signal(new Set<string>());
    showPoliticianMenu = signal(false);
    politicianSearch   = signal('');

    // Inversores institucionales (F5) — mismo patrón que congresistas: arranca vacío a propósito
    // (satura el gráfico si se muestran todos de entrada), filtro con buscador + seleccionar
    // todos/ninguno. Sin puntaje (no hay concepto de "acierto a 3 meses" para 13F todavía).
    activeInstitutions  = signal(new Set<string>());
    showInstitutionMenu = signal(false);
    institutionSearch   = signal('');

    // Perfil de riesgo del usuario (TAREA 14) — si es null, se abre el modal solo apenas carga el
    // Dashboard (no hay forma de cerrarlo sin elegir uno la primera vez). Con un botón para
    // cambiarlo después, ahí sí se puede cancelar sin tocar el que ya tenía.
    riskProfile         = signal<RiskProfile | null>(null);
    targetReturnPct     = signal<number | null>(null); // solo con riskProfile === ObjetivoRetorno
    targetPositionCount = signal<number | null>(null); // cantidad máxima de posiciones (opcional, 2026-08-15)
    showRiskProfileModal = signal(false);

    // Tabs del dashboard (2026-08-07) — Watcher (Admin/Plus) y Usuarios (solo Admin). Portfolio
    // es el contenido de siempre, sin cambios funcionales.
    activeTab = signal<'portfolio' | 'watcher' | 'admin'>('portfolio');
    readonly riskProfileOptions = RISK_PROFILE_OPTIONS;

    // Dropdown de usuario (reemplaza el botón "Salir" suelto) — mismo patrón simple que el dropdown
    // de congresistas, sin detección de click afuera. "Manual de uso" es un link directo a
    // /MANUAL-USUARIO.md (servido como estático desde public/) — un único archivo, sin una versión
    // resumida aparte que pueda quedar desincronizada del real.
    showUserMenu   = signal(false);

    // Tooltip flotante al hacer hover sobre una anotación de trade del Congreso — ApexCharts no
    // soporta un tooltip nativo en anotaciones xaxis (confirmado: es un feature pedido pero no
    // resuelto en su repo), así que se arma a mano con los mouseEnter/mouseLeave del label.
    hoveredCongressTrade = signal<{ trade: CongressionalTrade; x: number; y: number } | null>(null);

    // Mismo mecanismo de tooltip a mano, para las anotaciones 🏛 de inversores institucionales.
    hoveredInstitutionalMove = signal<{ move: InstitutionalMove; x: number; y: number } | null>(null);

    readonly periods     = PERIODS;

    // Mapa de colores armado una sola vez para TODO el portfolio (no símbolo por símbolo) — así
    // ningún símbolo se repite dentro del mismo dashboard. Ver nota en mock-portfolio.data.ts.
    private readonly colorMap = computed(() =>
      buildAssetColorMap((this.dashboardData()?.investments ?? []).map(i => i.symbol))
    );

    getColor(symbol: string): string {
      return this.colorMap().get(symbol) ?? '#94a3b8';
    }

    chartXAxis = computed(() => {
      const period = this.selectedPeriod();
      const max = new Date();

      let min: Date;
      if (period === 'Todo') {
        const data = this.dashboardData();
        const active = this.activeAssets();
        const allDates = (data?.investments ?? [])
          .filter(inv => active.has(inv.symbol))
          .flatMap(inv => inv.history.map(h => h.date))
          .sort();
        min = allDates.length ? new Date(allDates[0] + 'T00:00:00') : new Date(max.getFullYear() - 5, max.getMonth(), max.getDate());
      } else {
        const days = ({ '1M': 30, '3M': 90, '6M': 180, '1A': 365 } as Record<string, number>)[period] ?? 365;
        min = new Date();
        min.setDate(min.getDate() - days);
      }

      return {
        type: 'datetime' as const,
        min: min.getTime(),
        max: max.getTime(),
        labels: { style: { colors: '#64748b', fontSize: '11px' }, datetimeUTC: false },
        axisBorder: { color: '#334155' },
        axisTicks:  { color: '#334155' }
      };
    });

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
          // Arranca vacío a propósito — con todos los congresistas marcados de entrada la gráfica
          // se satura. El usuario los activa desde el dropdown "⭐ Filtrar congresistas".
          this.activePoliticians.set(new Set());
          this.activeInstitutions.set(new Set());
          this.loading.set(false);
          this.loadNews(data.investments.map(i => i.symbol));
        },
        error: err => {
          this.error.set('Error al cargar el dashboard. Intentá de nuevo.');
          this.loading.set(false);
          console.error(err);
        }
      });

      // Puntajes de congresistas — independiente del dashboard, no bloquea su carga si tarda o falla.
      this.congressScoreSvc.getScores().subscribe({
        next: scores => this.congressScores.set(scores),
        error: () => {} // sin puntajes todavía (nunca se corrió el refresh) — el filtro sigue funcionando sin estrellas
      });

      // Perfil de riesgo — si todavía no eligió ninguno, se abre el modal solo.
      this.profileSvc.getRiskProfile().subscribe({
        next: res => {
          this.riskProfile.set(res.riskProfile);
          this.targetReturnPct.set(res.targetReturnPct);
          this.targetPositionCount.set(res.targetPositionCount);
          if (res.riskProfile === null) this.showRiskProfileModal.set(true);
        },
        error: () => {}
      });
    }

    riskProfileLabel(profile: RiskProfile | null): string {
      if (profile === null) return 'Sin definir';
      if (profile === RiskProfile.ObjetivoRetorno) {
        const target = this.targetReturnPct();
        return target ? `≥${target}% anual` : 'Objetivo de retorno';
      }
      return this.riskProfileOptions.find(o => o.value === profile)?.label ?? 'Sin definir';
    }

    saveRiskProfile(event: RiskProfileSaveEvent): void {
      this.profileSvc.setRiskProfile(event.riskProfile, event.targetReturnPct, event.targetPositionCount).subscribe({
        next: () => {
          this.riskProfile.set(event.riskProfile);
          this.targetReturnPct.set(event.targetReturnPct ?? null);
          this.targetPositionCount.set(event.targetPositionCount ?? null);
          this.showRiskProfileModal.set(false);
        },
        error: () => {} // el modal se queda abierto, el usuario puede reintentar
      });
    }

    // Totales desde el backend
    totalValue = computed(() => this.dashboardData()?.totalCurrentValue ?? 0);
    totalProfit = computed(() => this.dashboardData()?.totalPnL ?? 0);
    totalProfitPercent = computed(() => this.dashboardData()?.totalPnLPercent ?? 0);
    isWinning = computed(() => this.totalProfit() >= 0);

    // Umbral de concentración (2026-08-16, mismo criterio que ConcentrationThresholdPct del
    // Advisor — ver BuildAdvisorContextService.cs) — visual acá, el freno real que le saca la
    // opción de reforzar al Advisor vive en el backend, esto es solo para que se vea siempre en
    // el dashboard, no solo cuando el Advisor descarta un candidato.
    readonly concentrationThresholdPct = 30;

    get positions() {
      const total = this.totalValue();
      return (this.dashboardData()?.investments ?? []).map(inv => ({
        id:               inv.id,
        symbol:           inv.symbol,
        name:             inv.name,
        broker:           inv.broker,
        volume:           inv.quantity,
        openPrice:        inv.buyPrice,
        currentPrice:     inv.currentPrice,
        value:            inv.currentValue,
        weightPercent:    total > 0 ? (inv.currentValue / total) * 100 : 0,
        netProfit:        inv.pnL,
        netProfitPercent: inv.pnLPercent,
        purchaseDate:     inv.purchaseDate,
        annualizedReturnPercent: this.annualizedReturnPercent(inv.purchaseDate, inv.pnLPercent)
      })).sort((a, b) => b.netProfitPercent - a.netProfitPercent);
    }

    // Convierte la ganancia acumulada desde la compra en una tasa efectiva anual (mismo CAGR que ya
    // usa el backend para el histórico de candidatos, ComputeHistoricalGrowthAsync) — pedido
    // explícito de Daniel: "para entenderlo mejor, comparado contra algo como un CDT". Se calcula
    // 100% en el frontend porque los tres datos que hacen falta (fecha de compra, P&L%) ya vienen en
    // la respuesta del dashboard, no hace falta pedirle nada nuevo al backend.
    // null si la posición tiene menos de 30 días — anualizar un puñado de días da un número absurdo
    // (ej. +2% en 3 días "anualizado" sería +unos cientos de % / año), mismo criterio de cautela que
    // ya usa el backend (actualYears < 0.5 se descarta en OpportunityPoolService).
    private annualizedReturnPercent(purchaseDateIso: string, pnLPercent: number): number | null {
      const purchaseDate = new Date(purchaseDateIso + (purchaseDateIso.includes('T') ? '' : 'T00:00:00'));
      const daysHeld = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysHeld < 30) return null;

      const years = daysHeld / 365.25;
      const growthFactor = 1 + pnLPercent / 100;
      if (growthFactor <= 0) return -100; // posición perdió el 100% o más (no debería pasar en la práctica, pero evita NaN de una raíz de negativo)

      return (Math.pow(growthFactor, 1 / years) - 1) * 100;
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
            .map(pt => ({ x: new Date(pt.date + 'T00:00:00').getTime(), y: pt.returnPercent }))
        }));
    });

    // Colores alineados con las series activas
    chartColors = computed(() => {
      const data = this.dashboardData();
      if (!data) return [];
      const active = this.activeAssets();
      return data.investments
        .filter(inv => active.has(inv.symbol))
        .map(inv => this.getColor(inv.symbol));
    });

    // Annotations (trades del congreso) — las marcas de "mis compras" se sacaron del dashboard
    // principal a propósito (pedido explícito de Daniel): quedan solo dentro de cada item
    // (investment-detail.component), donde tiene sentido verlas una por una, en azul fijo.
    chartAnnotations = computed(() => {
      const data = this.dashboardData();
      if (!data) return { points: [], xaxis: [], yaxis: [] };

      const xaxis: any[] = [];
      const active = this.activeAssets();

      // Trades del Congreso — reales, House Clerk oficial (F6)
      // Color por acción, no por activo: verde compra / rojo venta — mismo criterio que el resto
      // de la app usa para ganancia/pérdida (isWinning ? #22c55e : #ef4444).
      // El toggle "mostrar/ocultar todos" que antes vivía acá (showCongressional) se sacó — el
      // dropdown "⭐ Filtrar congresistas" con "Seleccionar todos"/"Desmarcar todos" ya cubre lo
      // mismo, no tenía sentido tener dos controles para lo mismo.
      const activePols = this.activePoliticians();
      data.congressionalTrades.filter(t => active.has(t.symbol) && activePols.has(t.member)).forEach(t => {
        const action   = t.action === 'BUY' ? 'COMPRÓ' : 'VENDIÓ';
        const lastName = t.member.split(' ')[1];
        const color    = t.action === 'BUY' ? '#22c55e' : '#ef4444';
        xaxis.push({
          x: new Date(t.date).getTime(),
          borderColor: color,
          borderWidth: 1,
          strokeDashArray: 4,
          label: {
            borderColor: color,
            text: `★ ${lastName} ${action} ${t.symbol} · ${t.amount}`,
            style: { color: '#fff', background: color, fontSize: '9px',
                     padding: { left: 4, right: 4, top: 2, bottom: 2 } },
            mouseEnter: (_annotation: unknown, e: MouseEvent) =>
              this.hoveredCongressTrade.set({ trade: t, x: e.clientX, y: e.clientY }),
            mouseLeave: () => this.hoveredCongressTrade.set(null)
          }
        });
      });

      // Inversores institucionales (F5) — mismo mecanismo que los congresistas, ícono/color
      // distintos (🏛, azul/naranja) para distinguirlos de un vistazo de las estrellas ★ del
      // Congreso, pedido explícito de Daniel.
      const activeInsts = this.activeInstitutions();
      data.institutionalMoves.filter(m => active.has(m.symbol) && activeInsts.has(m.investorName)).forEach(m => {
        const actionLabel = this.institutionActionLabel(m.action);
        // Mismo criterio verde/rojo que los congresistas (TAREA 10.1) — lo que distingue
        // institucionales de congresistas es el ícono (🏛 vs ★), no el color.
        const color = m.action === 'DECREASED' ? '#ef4444' : '#22c55e';
        xaxis.push({
          x: new Date(m.quarterDate).getTime(),
          borderColor: color,
          borderWidth: 1,
          strokeDashArray: 4,
          label: {
            borderColor: color,
            text: `🏛 ${m.investorName} ${actionLabel} ${m.symbol}`,
            style: { color: '#fff', background: color, fontSize: '9px',
                     padding: { left: 4, right: 4, top: 2, bottom: 2 } },
            mouseEnter: (_annotation: unknown, e: MouseEvent) =>
              this.hoveredInstitutionalMove.set({ move: m, x: e.clientX, y: e.clientY }),
            mouseLeave: () => this.hoveredInstitutionalMove.set(null)
          }
        });
      });

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
      xaxis: { type: 'category' as const, axisBorder: { color: '#334155' }, axisTicks: { color: '#334155' } },
      yaxis: {
        title: { text: 'Rendimiento (%)', style: { color: '#475569', fontSize: '10px', fontWeight: 400 } },
        labels: { style: { colors: '#64748b', fontSize: '11px' },
                  formatter: (val: number) => val != null ? `${val.toFixed(1)}%` : '' }
      },
      grid:    { borderColor: '#1e293b', strokeDashArray: 4 },
      tooltip: { theme: 'dark', y: { formatter: (val: number) => val != null ? `${val.toFixed(2)}%` : '' } },
      legend:  { show: false },
      theme:   { mode: 'dark' as const }
    };

    private filterByPeriod(history: PriceHistoryPoint[], period: string): PriceHistoryPoint[] {
      const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
      if (period === 'Todo') return sorted;

      const days = { '1M': 30, '3M': 90, '6M': 180, '1A': 365 }[period] ?? 365;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().substring(0, 10);
      return sorted.filter(pt => pt.date >= cutoffStr);
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

    // Lista de congresistas para el dropdown — únicos, ordenados de mejor a peor puntaje (los sin
    // puntaje todavía, al final, orden alfabético). Se arma a partir de los trades reales del
    // dashboard, no de congressScores directamente — así aparecen igual aunque todavía no tengan
    // puntaje calculado (nunca se corrió el refresh, o sus compras son muy recientes para evaluar).
    politicianOptions = computed(() => {
      const data = this.dashboardData();
      if (!data) return [];

      const scoreByName = new Map(this.congressScores().map(s => [s.politicianName, s]));
      const names = [...new Set(data.congressionalTrades.map(t => t.member))];

      return names
        .map(name => ({ name, score: scoreByName.get(name) ?? null }))
        .sort((a, b) => {
          const starsA = a.score?.starRating ?? 0;
          const starsB = b.score?.starRating ?? 0;
          return starsB - starsA || a.name.localeCompare(b.name);
        });
    });

    // Lista visible en el dropdown, filtrada por lo que se escribe en el buscador. Seleccionar
    // todos/ninguno sigue operando sobre politicianOptions() completo, no sobre lo filtrado — evita
    // que "Desmarcar todos" con un texto de búsqueda activo deje a medio marcar sin que se note.
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

    // Lista de institucionales para el dropdown — únicos, orden alfabético (sin puntaje, a
    // diferencia de congresistas, no hay concepto de "acierto a 3 meses" para 13F todavía).
    institutionOptions = computed(() => {
      const data = this.dashboardData();
      if (!data) return [];
      return [...new Set(data.institutionalMoves.map(m => m.investorName))].sort();
    });

    filteredInstitutionOptions = computed(() => {
      const query = this.institutionSearch().trim().toLowerCase();
      const options = this.institutionOptions();
      if (!query) return options;
      return options.filter(name => name.toLowerCase().includes(query));
    });

    toggleInstitution(name: string): void {
      this.activeInstitutions.update(set => {
        const next = new Set(set);
        next.has(name) ? next.delete(name) : next.add(name);
        return next;
      });
    }

    isInstitutionActive(name: string): boolean {
      return this.activeInstitutions().has(name);
    }

    selectAllInstitutions(): void {
      this.activeInstitutions.set(new Set(this.institutionOptions()));
    }

    selectNoneInstitutions(): void {
      this.activeInstitutions.set(new Set());
    }

    institutionActionLabel(action: string): string {
      switch (action) {
        case 'BUY': return 'compró';
        case 'INCREASED': return 'aumentó su posición en';
        case 'DECREASED': return 'redujo su posición en';
        default: return action.toLowerCase();
      }
    }

    formatShares(shares: number): string {
      return new Intl.NumberFormat('en-US').format(shares);
    }

    formatQuarterDate(isoDate: string): string {
      return new Date(isoDate).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    }

    institutionDisplayName(name: string): string {
      return institutionDisplayName(name);
    }

    // ★★★☆☆ — repite el carácter según el puntaje, sin puntaje = "sin evaluar todavía"
    starsLabel(starRating: number | null): string {
      if (starRating === null) return 'sin evaluar';
      return '★'.repeat(starRating) + '☆'.repeat(5 - starRating);
    }

    formatUSD(value: number): string {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    formatPercent(value: number): string {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }

    // "ene 2024" — formato compacto para mostrar junto a la ganancia acumulada, así queda claro
    // desde cuándo se está contando (pedido explícito de Daniel: "no sé desde cuándo se ve en la
    // columna ganancia/pérdida" — la fecha ya estaba en los datos, solo no se mostraba).
    formatPurchaseDateShort(isoDate: string): string {
      const date = new Date(isoDate + (isoDate.includes('T') ? '' : 'T00:00:00'));
      return date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
    }

    formatTradeDate(isoDate: string): string {
      return new Date(isoDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    tradeActionLabel(action: string): string {
      return action === 'BUY' ? 'Compró' : 'Vendió';
    }

    openAddForm(): void {
      this.showAddForm.set(true);
    }

    retry(): void {
      window.location.reload();
    }

    navigateToDetail(symbol: string): void {
      this.router.navigate(['/portfolio', symbol]);
    }

    confirmDelete(pos: { id: string; name: string; symbol: string }): void {
      this.investmentToDelete.set(pos);
      this.deleteReason.set('');
    }

    onDeleteConfirmed(): void {
      const target = this.investmentToDelete();
      if (!target) return;

      this.investSvc.delete(target.id, this.deleteReason()).subscribe({
        next: () => {
          this.investmentToDelete.set(null);
          this.deleteReason.set('');
          this.reloadDashboard();
        },
        error: (err) => {
          console.error('Error al eliminar', err);
          this.investmentToDelete.set(null);
          this.deleteReason.set('');
        }
      });
    }

    // Extrae la recarga en un método reutilizable (usado por add y delete)
    private reloadDashboard(): void {
      this.loading.set(true);
      this.dashboardSvc.getDashboard().subscribe({
        next: data => {
          this.dashboardData.set(data);
          this.activeAssets.set(new Set(data.investments.map(i => i.symbol)));
          // Arranca vacío a propósito — con todos los congresistas marcados de entrada la gráfica
          // se satura. El usuario los activa desde el dropdown "⭐ Filtrar congresistas".
          this.activePoliticians.set(new Set());
          this.activeInstitutions.set(new Set());
          this.loading.set(false);
          this.loadNews(data.investments.map(i => i.symbol));
        },
        error: () => {
          this.error.set('Error al recargar el dashboard.');
          this.loading.set(false);
        }
      });
    }

    onInvestmentSaved(): void {
      this.showAddForm.set(false);
      this.reloadDashboard();
    }

    // Carga noticias para todos los símbolos del portfolio en paralelo (forkJoin)
    // y las mezcla ordenadas de más nueva a más vieja.
    private loadNews(symbols: string[]): void {
      if (!symbols.length) return;

      forkJoin(symbols.map(s => this.newsSvc.getNews(s))).subscribe({
        next: results => {
          const flat = results
            .flat()
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
          this.allNews.set(flat);
        },
        error: () => {} // silencioso — las noticias son secundarias al dashboard
      });
    }

    // "hace 3h" / "hace 2d"
    formatNewsDate(dateStr: string): string {
      const diffMs    = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 24) return `hace ${diffHours}h`;
      return `hace ${Math.floor(diffHours / 24)}d`;
    }

    logout() {
      this.authService.logout();
    }
  }