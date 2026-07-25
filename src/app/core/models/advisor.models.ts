export interface AdvisorMessage {
    role: 'user' | 'assistant';
    content: string;
    createdAt?: string;
}
