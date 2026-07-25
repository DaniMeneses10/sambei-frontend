// Interfaces TypeScript que reflejan exactamente los DTOs del backend (GET /api/dashboard).
// Cada interface aquí tiene su equivalente en Sambei.Application/Dashboard/DTOs/*.cs
// Si cambia un DTO en el backend, hay que actualizar la interface correspondiente aquí.

// Un punto de la gráfica: precio de cierre de un día + rendimiento desde compra
export interface PriceHistoryPoint {
    date: string;
    close: number;
    returnPercent: number;
  }

  export interface DashboardInvestment {
    id: string;
    name: string;
    symbol: string;
    assetType: number;
    broker: string;
    quantity: number;
    buyPrice: number;
    currentPrice: number;
    currentValue: number;
    pnL: number;
    pnLPercent: number;
    purchaseDate: string;
    history: PriceHistoryPoint[];
  }

  export interface CongressionalTrade {
    symbol: string;
    member: string;
    action: 'BUY' | 'SELL';
    amount: string;
    date: string;
  }

  export interface InstitutionalMove {
    investorName: string;
    symbol: string;
    action: string;
    shares: number;
    quarterDate: string;
  }

  export interface DashboardResponse {
    investments: DashboardInvestment[];
    totalInvested: number;
    totalCurrentValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    congressionalTrades: CongressionalTrade[];
    institutionalMoves: InstitutionalMove[];
  }
