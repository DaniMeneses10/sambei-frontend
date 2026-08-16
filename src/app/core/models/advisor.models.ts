export interface AdvisorMessage {
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
}

// Mismos valores que Sambei.Domain.Enum.RecommendationAction — serializa como número, no como string.
export enum RecommendationAction {
    Buy = 0,
    Sell = 1
}

// Auto-detección (2026-08-15): "Sambei notó que compraste/vendiste X" — ver
// GetPendingAdvisorAlertsQueryHandler en el backend.
export interface AdvisorAlert {
    id: string;
    symbol: string;
    action: RecommendationAction;
    suggestedQuantity: number | null;
    suggestedAmountUsd: number | null;
    priceAtRecommendation: number | null;
    confirmedAt: string;
}
