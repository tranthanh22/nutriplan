import { z } from 'zod';

export const AiHealthInsightSchema = z.object({
  summary: z.string().min(1).max(1000),
  observations: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        evidence: z.string().min(1).max(500),
        confidence: z.enum(['low', 'medium', 'high']),
      }),
    )
    .max(6),
  actionable_suggestions: z.array(z.string().min(1).max(500)).max(6),
  questions_for_user: z.array(z.string().min(1).max(500)).max(5),
  limitations: z.array(z.string().min(1).max(500)).max(6),
  safety_flags: z.array(z.string().min(1).max(300)).max(6),
  recommend_professional_review: z.boolean(),
});

export type AiHealthInsight = z.infer<typeof AiHealthInsightSchema>;
