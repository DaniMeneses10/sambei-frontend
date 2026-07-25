 export interface Position {
      symbol: string;
      name: string;
      broker: string;
      volume: number;
      openPrice: number;
      currentPrice: number;
      value: number;
      netProfit: number;
      netProfitPercent: number;
  }

  export interface PricePoint {
      date: string;
      returnPercent: number;
  }

  export const MOCK_POSITIONS: Position[] = [
      {
          symbol: 'EIMI', name: 'Core MSCI EM IMI ETF', broker: 'XTB',
          volume: 9.004, openPrice: 41.678, currentPrice: 53.310,
          value: 480.00, netProfit: 104.72, netProfitPercent: 27.90
      },
      {
          symbol: 'VWCE', name: 'FTSE All-World ETF', broker: 'XTB',
          volume: 4.0636, openPrice: 172.26, currentPrice: 185.14,
          value: 752.33, netProfit: 52.34, netProfitPercent: 7.48
      },
      {
          symbol: 'CNDX', name: 'NASDAQ 100 ETF', broker: 'XTB',
          volume: 0.291, openPrice: 1196.40, currentPrice: 1443.80,
          value: 485.80, netProfit: 73.20, netProfitPercent: 17.74
      }
  ];

  export const MOCK_HISTORY: Record<string, PricePoint[]> = {
      EIMI: [
          { date: '2024-01', returnPercent: 0.0  },
          { date: '2024-02', returnPercent: 1.2  },
          { date: '2024-03', returnPercent: 4.4  },
          { date: '2024-04', returnPercent: 6.1  },
          { date: '2024-05', returnPercent: 5.3  },
          { date: '2024-06', returnPercent: 8.2  },
          { date: '2024-07', returnPercent: 9.8  },
          { date: '2024-08', returnPercent: 11.6 },
          { date: '2024-09', returnPercent: 10.1 },
          { date: '2024-10', returnPercent: 13.3 },
          { date: '2024-11', returnPercent: 17.4 },
          { date: '2024-12', returnPercent: 20.2 },
          { date: '2025-01', returnPercent: 23.0 },
          { date: '2025-02', returnPercent: 21.5 },
          { date: '2025-03', returnPercent: 24.8 },
          { date: '2025-04', returnPercent: 26.5 },
          { date: '2025-05', returnPercent: 27.9 },
      ],
      VWCE: [
          { date: '2024-01', returnPercent: 0.0  },
          { date: '2024-02', returnPercent: 0.7  },
          { date: '2024-03', returnPercent: 1.7  },
          { date: '2024-04', returnPercent: 1.5  },
          { date: '2024-05', returnPercent: 2.2  },
          { date: '2024-06', returnPercent: 3.0  },
          { date: '2024-07', returnPercent: 3.6  },
          { date: '2024-08', returnPercent: 4.2  },
          { date: '2024-09', returnPercent: 3.8  },
          { date: '2024-10', returnPercent: 5.0  },
          { date: '2024-11', returnPercent: 5.7  },
          { date: '2024-12', returnPercent: 6.5  },
          { date: '2025-01', returnPercent: 6.1  },
          { date: '2025-02', returnPercent: 6.7  },
          { date: '2025-03', returnPercent: 7.0  },
          { date: '2025-04', returnPercent: 7.3  },
          { date: '2025-05', returnPercent: 7.48 },
      ],
      CNDX: [
          { date: '2024-01', returnPercent: 0.0  },
          { date: '2024-02', returnPercent: 2.8  },
          { date: '2024-03', returnPercent: 7.0  },
          { date: '2024-04', returnPercent: 4.5  },
          { date: '2024-05', returnPercent: 7.8  },
          { date: '2024-06', returnPercent: 12.8 },
          { date: '2024-07', returnPercent: 10.4 },
          { date: '2024-08', returnPercent: 15.4 },
          { date: '2024-09', returnPercent: 13.7 },
          { date: '2024-10', returnPercent: 17.1 },
          { date: '2024-11', returnPercent: 19.6 },
          { date: '2024-12', returnPercent: 17.9 },
          { date: '2025-01', returnPercent: 18.7 },
          { date: '2025-02', returnPercent: 14.2 },
          { date: '2025-03', returnPercent: 17.8 },
          { date: '2025-04', returnPercent: 19.5 },
          { date: '2025-05', returnPercent: 17.74 },
      ]
  };

  // Colores fijos para el portfolio real de Daniel — se mantienen así (mismo color de siempre, sin
  // "saltar" al agregar/quitar símbolos). Cualquier símbolo que NO esté acá (el portfolio de
  // cualquier otro usuario) cae en getAssetColor(), no en un único color plano.
  export const ASSET_COLORS: Record<string, string> = {
      // ETFs europeos (XTB)
      EIMI: '#0ea5e9',
      VWCE: '#22c55e',
      CNDX: '#f59e0b',
      // ETFs y acciones US (HAPI)
      QQQ:  '#6366f1',
      VOO:  '#10b981',
      VGT:  '#8b5cf6',
      NVDA: '#84cc16',
      AMZN: '#f97316',
      NU:   '#ec4899',
      NOW:  '#06b6d4',
  };

  // Paleta de respaldo para símbolos que no están en ASSET_COLORS (cualquier usuario que no sea
  // Daniel, o un símbolo nuevo que él todavía no tenía).
  const FALLBACK_PALETTE = [
      '#0ea5e9', '#22c55e', '#f59e0b', '#6366f1', '#10b981', '#8b5cf6',
      '#84cc16', '#f97316', '#ec4899', '#06b6d4', '#eab308', '#f43f5e',
      '#14b8a6', '#a855f7', '#3b82f6', '#d946ef',
  ];

  // Bug real encontrado 2026-07-25 (reportado por el equipo probando en el celular): la primera
  // versión de este fallback hasheaba cada símbolo por separado a un índice de la paleta — probado
  // contra un portfolio típico de 10 tickers y YA colisionaba (dos símbolos distintos cayendo en el
  // mismo color), porque un hash aislado no tiene forma de saber qué colores ya están en uso en ESE
  // portfolio puntual. Fix real: en vez de hashear símbolo por símbolo, se arma un mapa para TODO el
  // conjunto de símbolos de una vez, repartiendo la paleta sin repetir dentro de ese conjunto —
  // mismo criterio que usar cartas de un mazo sin reponer, no tirar un dado por separado para cada
  // uno. Orden alfabético (no el orden en que vienen de la API, que puede cambiar por el sorteo por
  // rentabilidad) para que la asignación sea estable entre recargas.
  export function buildAssetColorMap(symbols: string[]): Map<string, string> {
      const map = new Map<string, string>();
      const usedColors = new Set<string>();
      const unique = Array.from(new Set(symbols)).sort();

      for (const symbol of unique) {
          if (ASSET_COLORS[symbol]) {
              map.set(symbol, ASSET_COLORS[symbol]);
              usedColors.add(ASSET_COLORS[symbol]);
          }
      }

      const available = FALLBACK_PALETTE.filter(c => !usedColors.has(c));
      let i = 0;
      for (const symbol of unique) {
          if (map.has(symbol)) continue;
          map.set(symbol, available[i % available.length]);
          i++;
      }

      return map;
  }

  // Para contextos de un solo símbolo (ej. la página de detalle de un item) — ahí no hay ningún
  // otro símbolo con el que colisionar, un mapa de un solo elemento alcanza.
  export function getAssetColor(symbol: string): string {
      return buildAssetColorMap([symbol]).get(symbol)!;
  }

  export const PERIODS = ['1M', '3M', '6M', '1A', 'Todo'];

  export const PERIOD_MONTHS: Record<string, number> = {
      '1M': 2, '3M': 4, '6M': 7, '1A': 17
  };