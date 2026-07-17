import type { AiHealthInsight } from './ai-insight.schema';

export const HEALTH_INSIGHT_PROVIDER = Symbol('HEALTH_INSIGHT_PROVIDER');

export interface HealthInsightGeneration {
  output: AiHealthInsight;
  inputTokens: number | null;
  outputTokens: number | null;
  responseId: string;
}

export interface HealthInsightProvider {
  readonly providerName: string;
  readonly modelName: string;
  generate(
    input: Record<string, unknown>,
    safetyIdentifier: string,
  ): Promise<HealthInsightGeneration>;
}
