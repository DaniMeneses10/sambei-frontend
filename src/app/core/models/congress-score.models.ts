// Refleja CongressMemberScoreDto (Sambei.Application/CongressionalTrades/DTOs).
export interface CongressMemberScore {
  politicianName: string;
  evaluatedTradesCount: number;
  averageReturnPct: number;
  starRating: number; // 1-5
}
