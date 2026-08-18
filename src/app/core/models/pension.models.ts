export type PensionRiskProfile = 'Conservador' | 'Moderado' | 'Agresivo';
export type PensionLiquidityType = 'Diaria' | 'Semanal' | 'Semestral' | 'PlazoFijo';

// Catálogo de referencia (F12 — Skandia) — dato real de los prospectos, global, no por usuario.
export interface PensionPortfolio {
    id: string;
    name: string;
    shortCode: string;
    classification: string;
    region: string;
    riskProfile: PensionRiskProfile;
    feeMinPct: number;
    feeMaxPct: number;
    liquidityType: PensionLiquidityType;
    fixedTermMonths: number | null;
    benchmark: string | null;
    minEquityPct: number | null;
    maxEquityPct: number | null;
    notes: string;
    asOfDate: string;
}

export interface PensionDashboardItem {
    portfolioId: string;
    name: string;
    shortCode: string;
    riskProfile: PensionRiskProfile;
    totalContributedCop: number;
    latestValuationCop: number | null;
    valuationAsOfDate: string | null;
    hasValuation: boolean;
    effectiveValueCop: number;
    weightPct: number;
    targetPct: number | null;
}

export interface PensionDashboard {
    items: PensionDashboardItem[];
    totalContributedCop: number;
    totalEffectiveValueCop: number;
    totalGainLossCop: number | null;
    totalGainLossPct: number | null;
}

export interface AddPensionContributionRequest {
    portfolioId: string;
    amountCop: number;
    contributionDate: string; // ISO date string
    note: string | null;
}

export interface AddPensionValuationRequest {
    portfolioId: string;
    valueCop: number;
    asOfDate: string; // ISO date string
}

export interface PensionAllocationTargetRequest {
    portfolioId: string;
    targetPct: number;
}
