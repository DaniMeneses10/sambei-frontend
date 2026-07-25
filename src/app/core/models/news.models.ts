// Refleja el NewsItemDto del backend (GET /api/news/{symbol})
export interface NewsItem {
    title:          string;
    summary:        string;
    url:            string;
    symbol:         string;
    sentimentScore: number | null;
    publishedAt:    string; // ISO 8601
}
