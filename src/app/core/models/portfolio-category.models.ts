// Refleja PortfolioCategoryGapDto / PortfolioCategoryTargetRequest (backend) — ver
// GetPortfolioCategoryGapQueryHandler / PortfolioCategoriesEndpoints (F11 Fase 2, 2026-09-04).

export interface PortfolioCategoryGap {
    category: string;
    targetPct: number;
    currentPct: number;
    gapPct: number;
}

export interface PortfolioCategoryTargetRequest {
    category: string;
    targetPct: number;
}

export interface PositionCategory {
    symbol: string;
    category: string | null;
}

export interface EtfHoldingSummary {
    symbol: string;
    name: string;
    weightPct: number;
}
