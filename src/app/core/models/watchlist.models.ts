// Refleja WatchlistCandidateDto / CandidateGrowthPoint / CandidateBuyer (backend) — ver
// GetWatchlistCandidatesQueryHandler + OpportunityPoolService.

export interface CandidateBuyer {
    name: string;
    stars: number;
}

export interface CandidateGrowthPoint {
    requestedYears: number;
    actualYears: number;
    startPrice: number;
    endPrice: number;
    totalReturnPct: number;
    cagrPct: number;
    hypotheticalToday: number;
}

export interface WatchlistPricePoint {
    date: string; // yyyy-MM-dd
    close: number;
}

export interface WatchlistCandidate {
    symbol: string;
    currentPrice: number;
    congressBuyers: CandidateBuyer[];
    institutionalBuyers: string[];
    growth: CandidateGrowthPoint[];
    priceHistory: WatchlistPricePoint[];
}
