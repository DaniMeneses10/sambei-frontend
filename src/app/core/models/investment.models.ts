  import { AssetType } from "./asset-type.enum";
  import { CongressionalTrade, InstitutionalMove, PriceHistoryPoint } from '../../features/dashboard/dashboard.models';
  import { NewsItem } from './news.models';


export interface CreateInvestmentRequest {
    name: string;
    symbol: string;
    providerSymbol: string | null;// null para US/Crypto, "EIMI.L" para EU ETFs
    assetType: AssetType;
    broker: string;
    quantity: number;
    buyPrice: number;
    purchaseDate: string; // ISO date string
}

// Una compra individual (lote) — un símbolo puede tener varias si se compró más de una vez (DCA)
export interface PurchaseEvent {
    id:       string; // Guid del Investment real — lo necesita el edit
    date:     string; // ISO date string
    quantity: number;
    price:    number;
    broker:   string;
}

export interface UpdateInvestmentRequest {
    quantity:     number;
    buyPrice:     number;
    purchaseDate: string; // ISO date string
    broker:       string;
}

export interface InvestmentDetailResponse {
    symbol:         string;
    name:           string;
    broker:         string;
    assetType:      AssetType;
    providerSymbol: string | null;
    quantity:     number; // agregado: suma de todos los lotes
    buyPrice:     number; // agregado: precio promedio ponderado (costo promedio)
    currentPrice: number;
    currentValue: number;
    pnL:          number;
    pnLPercent:   number;
    history:      PriceHistoryPoint[];
    news:         NewsItem[];
    purchases:    PurchaseEvent[];
    congressionalTrades: CongressionalTrade[];
    institutionalMoves: InstitutionalMove[];
}