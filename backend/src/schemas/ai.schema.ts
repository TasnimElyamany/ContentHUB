import { z } from 'zod';

export const aiGenerateSchema = z.object({
  body: z.object({
    prompt: z.string().min(1, 'Prompt is required').max(2000),
    tone: z.enum(['professional', 'casual', 'creative', 'friendly']),
    length: z.enum(['short', 'medium', 'long']),
    documentId: z.string().min(1, 'Document ID is required'),
  }),
});

export const aiEnhanceSchema = z.object({
  body: z.object({
    text: z.string().min(1, 'Text is required').max(5000),
    action: z.enum(['improve', 'grammar', 'shorten', 'expand', 'tone']),
    tone: z.enum(['professional', 'casual', 'friendly']).optional(),
    documentId: z.string().min(1, 'Document ID is required'),
  }),
});

export type AIGenerateInput = z.infer<typeof aiGenerateSchema>['body'];
export type AIEnhanceInput = z.infer<typeof aiEnhanceSchema>['body'];
