import { User, ContentDocument, AIUsage } from '../models';
import { ApiError } from '../utils/apiError';
import { AIGenerateInput, AIEnhanceInput } from '../schemas/ai.schema';
import { config } from '../config';

// Simulated AI responses for dev/testing
class AIService {
  async generate(
    userId: string,
    data: AIGenerateInput
  ): Promise<{ result: string; tokensUsed: number; creditsRemaining: number }> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const creditsNeeded = this.estimateCredits(data.length);
    if (user.aiCredits.used + creditsNeeded > user.aiCredits.total) {
      throw ApiError.tooManyRequests('Insufficient AI credits');
    }
    const document = await ContentDocument.findById(data.documentId);
    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    // Generate content (mock implementation for now)
    const result = await this.callAI('generate', data.prompt, data.tone, data.length);
    const tokensUsed = this.calculateTokens(result);

    user.aiCredits.used += creditsNeeded;
    await user.save();

    document.aiUsage.generateCalls += 1;
    document.aiUsage.totalTokens += tokensUsed;
    await document.save();

    await AIUsage.create({
      userId,
      documentId: data.documentId,
      workspaceId: document.workspace,
      action: 'generate',
      provider: 'mock',
      tokensUsed,
      prompt: data.prompt,
      response: result,
    });

    return {
      result,
      tokensUsed,
      creditsRemaining: user.aiCredits.total - user.aiCredits.used,
    };
  }

  async enhance(
    userId: string,
    data: AIEnhanceInput
  ): Promise<{ result: string; tokensUsed: number; creditsRemaining: number }> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const creditsNeeded = 10; // Fixed cost for enhancement
    if (user.aiCredits.used + creditsNeeded > user.aiCredits.total) {
      throw ApiError.tooManyRequests('Insufficient AI credits');
    }

    const document = await ContentDocument.findById(data.documentId);
    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    // Enhance content (mock implementation)
    const result = await this.callEnhanceAI(data.text, data.action, data.tone);
    const tokensUsed = this.calculateTokens(result);

    user.aiCredits.used += creditsNeeded;
    await user.save();

    document.aiUsage.improveCalls += 1;
    document.aiUsage.totalTokens += tokensUsed;
    await document.save();

    await AIUsage.create({
      userId,
      documentId: data.documentId,
      workspaceId: document.workspace,
      action: data.action,
      provider: 'mock',
      tokensUsed,
      prompt: data.text,
      response: result,
    });

    return {
      result,
      tokensUsed,
      creditsRemaining: user.aiCredits.total - user.aiCredits.used,
    };
  }

  async getCredits(userId: string): Promise<{
    total: number;
    used: number;
    remaining: number;
    resetDate: Date;
  }> {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      total: user.aiCredits.total,
      used: user.aiCredits.used,
      remaining: user.aiCredits.total - user.aiCredits.used,
      resetDate: user.aiCredits.resetDate,
    };
  }

  // Mock AI call - replace with actual API in production
  private async callAI(
    type: string,
    prompt: string,
    tone: string,
    length: string
  ): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const toneModifier = {
      professional: 'In a professional manner, ',
      casual: 'Casually speaking, ',
      creative: 'Creatively put, ',
      friendly: 'In a friendly tone, ',
    }[tone] || '';

    const lengthMultiplier = {
      short: 1,
      medium: 2,
      long: 3,
    }[length] || 1;

    const baseResponse = `${toneModifier}here is generated content based on your prompt: "${prompt}". `;
    return baseResponse.repeat(lengthMultiplier);
  }

  // Mock enhance AI call
  private async callEnhanceAI(
    text: string,
    action: string,
    tone?: string
  ): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    switch (action) {
      case 'improve':
        return `Improved: ${text}`;
      case 'grammar':
        return text.charAt(0).toUpperCase() + text.slice(1);
      case 'shorten':
        return text.split(' ').slice(0, Math.ceil(text.split(' ').length / 2)).join(' ');
      case 'expand':
        return `${text} Additionally, this topic encompasses several important aspects worth exploring.`;
      case 'tone':
        return `[${tone || 'professional'} tone] ${text}`;
      default:
        return text;
    }
  }

  private estimateCredits(length: string): number {
    const credits = {
      short: 10,
      medium: 20,
      long: 40,
    };
    return credits[length as keyof typeof credits] || 10;
  }

  private calculateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

export const aiService = new AIService();
