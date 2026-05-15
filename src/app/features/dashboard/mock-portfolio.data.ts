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

  export interface CongressTrade {
      date: string;
      symbol: string;
      member: string;
      action: 'BUY' | 'SELL';
      amount: string;
  }

  export interface AiSignal {
      symbol: string;
      name: string;
      signal: 'BUY' | 'HOLD' | 'CAUTION';
      summary: string;
      detail: string;
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

  export const MOCK_CONGRESS_TRADES: CongressTrade[] = [
      { date: '2024-03', symbol: 'CNDX', member: 'Nancy Pelosi',    action: 'BUY',  amount: '$500k-$1M'   },
      { date: '2024-07', symbol: 'EIMI', member: 'Dan Crenshaw',    action: 'BUY',  amount: '$15k-$50k'   },
      { date: '2024-10', symbol: 'VWCE', member: 'Josh Gottheimer', action: 'BUY',  amount: '$50k-$100k'  },
      { date: '2025-02', symbol: 'CNDX', member: 'Nancy Pelosi',    action: 'SELL', amount: '$250k-$500k' },
  ];


  export const MOCK_AI_SIGNALS: AiSignal[] = [
      {
          symbol: 'EIMI', name: 'Core MSCI EM IMI',
          signal: 'HOLD',
          summary: 'Mercados emergentes con momentum positivo.',
          detail: 'Estímulo fiscal en China y recuperación en India impulsan el índice. Mantener posición. Considerar agregar en caídas bajo $50.'
      },
      {
          symbol: 'VWCE', name: 'FTSE All-World',
          signal: 'BUY',
          summary: 'Diversificación global a valoración justa.',
          detail: 'Equilibrio entre mercados desarrollados y emergentes. Crecimiento constante. Oportunidad para incrementar posición.'
      },
      {
          symbol: 'CNDX', name: 'NASDAQ 100',
          signal: 'CAUTION',
          summary: 'Valuaciones tech en zona de riesgo.',
          detail: 'P/E elevados en sector tech. Volatilidad reciente (-5% feb 2025). Pelosi compró en feb. Considerar toma parcial de ganancias.'
      }
  ];

  export const ASSET_COLORS: Record<string, string> = {
      EIMI: '#0ea5e9',
      VWCE: '#22c55e',
      CNDX: '#f59e0b'
  };

  export const PERIODS = ['1M', '3M', '6M', '1A'];

  export const PERIOD_MONTHS: Record<string, number> = {
      '1M': 2, '3M': 4, '6M': 7, '1A': 17
  };