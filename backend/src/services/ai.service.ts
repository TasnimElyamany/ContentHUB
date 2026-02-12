import Groq from 'groq-sdk';
import { User, ContentDocument, AIUsage } from '../models';
import { ApiError } from '../utils/apiError';
import { AIGenerateInput, AIEnhanceInput } from '../schemas/ai.schema';
import { config } from '../config';
import { logger } from '../utils/logger';

const groq = new Groq({ apiKey: config.ai.groqApiKey });

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

    const result = await this.callGroqGenerate(data.prompt, data.tone, data.length);
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
      provider: 'groq',
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

    const creditsNeeded = 10;
    if (user.aiCredits.used + creditsNeeded > user.aiCredits.total) {
      throw ApiError.tooManyRequests('Insufficient AI credits');
    }

    const document = await ContentDocument.findById(data.documentId);
    if (!document) {
      throw ApiError.notFound('Document not found');
    }

    const result = await this.callGroqEnhance(data.text, data.action, data.tone);
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
      provider: 'groq',
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

  private async callGroqGenerate(
    prompt: string,
    tone: string,
    length: string
  ): Promise<string> {
    const maxTokens = {
      short: 300,
      medium: 600,
      long: 1200,
    }[length] || 600;

    const systemPrompt = `You are a professional content writer. Generate high-quality content based on the user's prompt.
Write in a ${tone} tone. Return the content as clean HTML using <p>, <h2>, <h3>, <ul>, <li>, <strong>, and <em> tags as appropriate.
Do not include any markdown formatting. Do not wrap the response in code blocks.`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: tone === 'creative' ? 0.9 : 0.7,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI');
      }
      return result;
    } catch (error: any) {
      logger.error('Groq generate error:', error);
      throw ApiError.internal(`AI generation failed: ${error.message}`);
    }
  }

  private async callGroqEnhance(
    text: string,
    action: string,
    tone?: string
  ): Promise<string> {
    const actionPrompts: Record<string, string> = {
      improve: `Improve the following text to make it clearer, more engaging, and better written. Keep the same meaning and approximate length.`,
      grammar: `Fix all grammar, spelling, and punctuation errors in the following text. Keep the original meaning and style intact.`,
      shorten: `Shorten the following text to roughly half its length while preserving the key points and meaning.`,
      expand: `Expand the following text with more detail, examples, and context. Make it roughly twice as long.`,
      tone: `Rewrite the following text in a ${tone || 'professional'} tone. Keep the same meaning and information.`,
    };

    const systemPrompt = `You are a professional editor. ${actionPrompts[action] || actionPrompts.improve}
Return only the improved text as clean HTML using <p>, <strong>, and <em> tags as appropriate.
Do not include any markdown formatting or code blocks. Do not add any commentary or explanations.`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        max_tokens: 1000,
        temperature: 0.5,
      });

      const result = completion.choices[0]?.message?.content;
      if (!result) {
        throw new Error('No response from AI');
      }
      return result;
    } catch (error: any) {
      logger.error('Groq enhance error:', error);
      throw ApiError.internal(`AI enhancement failed: ${error.message}`);
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
