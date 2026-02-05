export interface AIGenerateRequest {
  prompt: string;
  tone: 'professional' | 'casual' | 'creative' | 'friendly';
  length: 'short' | 'medium' | 'long';
  documentId: string;
}

export interface AIEnhanceRequest {
  text: string;
  action: 'improve' | 'grammar' | 'shorten' | 'expand' | 'tone';
  tone?: 'professional' | 'casual' | 'friendly';
  documentId: string;
}

export interface AIResponse {
  result: string;
  tokensUsed: number;
  creditsRemaining: number;
}
