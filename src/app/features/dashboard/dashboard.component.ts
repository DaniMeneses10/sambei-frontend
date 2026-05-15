import { Component, computed, inject, signal } from '@angular/core';
  import { NgClass } from '@angular/common';
  import { Router } from '@angular/router';
  import { NgApexchartsModule } from 'ng-apexcharts';
  import { AuthService } from '../../core/services/auth.service';
  import {
      MOCK_POSITIONS, MOCK_HISTORY, MOCK_CONGRESS_TRADES,
      MOCK_AI_SIGNALS, ASSET_COLORS, PERIODS, PERIOD_MONTHS
  } from './mock-portfolio.data';

  @Component({
      selector: 'app-dashboard',
      imports: [NgApexchartsModule, NgClass],
      templateUrl: './dashboard.component.html',
  })
  export class DashboardComponent {
      private readonly router = inject(Router);
      readonly authService  = inject(AuthService);

      // Datos mock
      readonly positions    = MOCK_POSITIONS;
      readonly aiSignals    = MOCK_AI_SIGNALS;
      readonly periods      = PERIODS;
      readonly assetColors  = ASSET_COLORS;

      // Signals de filtros
      activeAssets      = signal(new Set(['EIMI', 'VWCE', 'CNDX']));
      showBuyPoints     = signal(true);
      showCongressional = signal(true);
      selectedPeriod    = signal('1A');

      // Totales del portfolio
      totalValue = computed(() =>
          this.positions.reduce((sum, p) => sum + p.value, 0)
      );
      totalProfit = computed(() =>
          this.positions.reduce((sum, p) => sum + p.netProfit, 0)
      );
      totalProfitPercent = computed(() => {
          const invested = this.totalValue() - this.totalProfit();
          return (this.totalProfit() / invested) * 100;
      });

      // Series de la gráfica — se recalcula cuando cambian los filtros
      chartSeries = computed(() => {
          const active = this.activeAssets();
          const take   = PERIOD_MONTHS[this.selectedPeriod()] ?? 17;

          return MOCK_POSITIONS
              .filter(p => active.has(p.symbol))
              .map(p => ({
                  name: p.symbol,
                  data: MOCK_HISTORY[p.symbol].slice(-take).map(pt => ({
                      x: pt.date,
                      y: pt.returnPercent
                  }))
              }));
      });

      // Colores alineados con las series activas
      chartColors = computed(() => {
          const active = this.activeAssets();
          return MOCK_POSITIONS
              .filter(p => active.has(p.symbol))
              .map(p => ASSET_COLORS[p.symbol]);
      });

      // Annotations (puntos de compra + trades congresistas)
      chartAnnotations = computed(() => {
          const xaxis: any[] = [];
          const active = this.activeAssets();
          const take   = PERIOD_MONTHS[this.selectedPeriod()] ?? 17;

          // Punto de compra — línea vertical coloreada en la fecha de compra
          // Solo visible en períodos donde enero 2024 entra en el rango (ej: 1A)
          if (this.showBuyPoints()) {
              MOCK_POSITIONS.filter(p => active.has(p.symbol)).forEach(p => {
                  const history    = MOCK_HISTORY[p.symbol];
                  const buyDate    = history[0].date;
                  const isVisible  = history.slice(-take).some(pt => pt.date === buyDate);

                  if (isVisible) {
                      xaxis.push({
                          x: buyDate,
                          borderColor: ASSET_COLORS[p.symbol],
                          borderWidth: 2,
                          strokeDashArray: 0,
                          label: {
                              borderColor: ASSET_COLORS[p.symbol],
                              offsetY: -5,
                              text: `▲ Compré ${p.symbol} a ${this.formatUSD(p.openPrice)}`,
                              style: {
                                  color: '#fff',
                                  background: ASSET_COLORS[p.symbol],
                                  fontSize: '9px',
                                  padding: { left: 4, right: 4, top: 2, bottom: 2 }
                              }
                          }
                      });
                  }
              });
          }

          // Trades del Congreso — línea del color del ETF involucrado con detalle completo
          if (this.showCongressional()) {
              MOCK_CONGRESS_TRADES.filter(t => active.has(t.symbol)).forEach(t => {
                  const action   = t.action === 'BUY' ? 'COMPRÓ' : 'VENDIÓ';
                  const lastName = t.member.split(' ')[1];
                  const color    = ASSET_COLORS[t.symbol];
                  xaxis.push({
                      x: t.date,
                      borderColor: color,
                      borderWidth: 1,
                      strokeDashArray: 4,
                      label: {
                          borderColor: color,
                          text: `★ ${lastName} ${action} ${t.symbol} · ${t.amount}`,
                          style: {
                              color: '#fff',
                              background: color,
                              fontSize: '9px',
                              padding: { left: 4, right: 4, top: 2, bottom: 2 }
                          }
                      }
                  });
              });
          }

          // Línea de referencia en 0% — indica el precio de compra original
          const yaxis = [{
              y: 0,
              borderColor: '#475569',
              borderWidth: 1,
              strokeDashArray: 3,
              label: {
                  borderColor: 'transparent',
                  text: 'Tu precio de compra',
                  position: 'left',
                  style: {
                      color: '#64748b',
                      background: 'transparent',
                      fontSize: '10px'
                  }
              }
          }];

          return { points: [], xaxis, yaxis };
      });

      // Configuración estática de la gráfica
      readonly chartConfig = {
          chart: {
              type: 'line' as const,
              height: 300,
              background: 'transparent',
              toolbar: { show: false },
              zoom:    { enabled: false }
          },
          stroke: { curve: 'smooth' as const, width: 2 },
          xaxis: {
              type: 'category' as const,
              labels: { style: { colors: '#64748b', fontSize: '11px' } },
              axisBorder: { color: '#334155' },
              axisTicks:  { color: '#334155' }
          },
          yaxis: {
              title: {
                  text: 'Rendimiento (%)',
                  style: { color: '#475569', fontSize: '10px', fontWeight: 400 }
              },
              labels: {
                  style: { colors: '#64748b', fontSize: '11px' },
                  formatter: (val: number) => `${val.toFixed(1)}%`
              }
          },
          grid:    { borderColor: '#1e293b', strokeDashArray: 4 },
          tooltip: {
              theme: 'dark',
              y: { formatter: (val: number) => `${val.toFixed(2)}%` }
          },
          legend: { show: false },
          theme:  { mode: 'dark' as const }
      };

      isWinning = computed(() => this.totalProfit() >= 0);

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

      signalColor(signal: string): string {
          return { BUY: '#22c55e', HOLD: '#0ea5e9', CAUTION: '#f59e0b' }[signal] ?? '#94a3b8';
      }

      signalIcon(signal: string): string {
          return { BUY: '▲', HOLD: '●', CAUTION: '▼' }[signal] ?? '●';
      }

      signalLabel(signal: string): string {
          return { BUY: 'COMPRAR', HOLD: 'MANTENER', CAUTION: 'PRECAUCIÓN' }[signal] ?? signal;
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