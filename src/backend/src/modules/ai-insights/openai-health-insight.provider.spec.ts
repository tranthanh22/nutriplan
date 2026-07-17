import {
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { APIConnectionTimeoutError } from 'openai';
import { OpenAiHealthInsightProvider } from './openai-health-insight.provider';

const validOutput = {
  summary: 'Tóm tắt hợp lệ',
  observations: [],
  actionable_suggestions: [],
  questions_for_user: [],
  limitations: [],
  safety_flags: [],
  recommend_professional_review: false,
};

function config(values: Record<string, string | number | undefined>) {
  return { get: jest.fn((key: string) => values[key]) } as never;
}

describe('OpenAiHealthInsightProvider', () => {
  it('rejects requests when an OpenAI key is absent', async () => {
    const provider = new OpenAiHealthInsightProvider(config({ OPENAI_MODEL: 'test-model' }));

    await expect(provider.generate({}, 'safe-id')).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps provider timeout to a gateway timeout', async () => {
    const provider = new OpenAiHealthInsightProvider(
      config({ OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'test-model' }),
    );
    Object.defineProperty(provider, 'client', {
      value: {
        responses: { parse: jest.fn().mockRejectedValue(new APIConnectionTimeoutError()) },
      },
    });

    await expect(provider.generate({}, 'safe-id')).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it('rejects output that does not match the expected schema', async () => {
    const provider = new OpenAiHealthInsightProvider(
      config({ OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'test-model' }),
    );
    Object.defineProperty(provider, 'client', {
      value: {
        responses: { parse: jest.fn().mockResolvedValue({ id: 'res_1', output_parsed: {} }) },
      },
    });

    await expect(provider.generate({}, 'safe-id')).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('returns validated structured output and usage', async () => {
    const provider = new OpenAiHealthInsightProvider(
      config({ OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'test-model' }),
    );
    Object.defineProperty(provider, 'client', {
      value: {
        responses: {
          parse: jest.fn().mockResolvedValue({
            id: 'res_1',
            output_parsed: validOutput,
            usage: { input_tokens: 11, output_tokens: 22 },
          }),
        },
      },
    });

    await expect(provider.generate({}, 'safe-id')).resolves.toMatchObject({
      output: validOutput,
      inputTokens: 11,
      outputTokens: 22,
    });
  });
});
