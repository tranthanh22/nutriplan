import {
  BadGatewayException,
  GatewayTimeoutException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiHealthInsightProvider } from './gemini-health-insight.provider';

const validOutput = {
  summary: 'Tóm tắt hợp lệ',
  observations: [],
  actionable_suggestions: [],
  questions_for_user: [],
  limitations: [],
  safety_flags: [],
  recommend_professional_review: false,
};

function provider(values: Record<string, unknown>) {
  return new GeminiHealthInsightProvider({
    get: (key: string) => values[key],
  } as ConfigService);
}

describe('GeminiHealthInsightProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects requests when a Gemini key is absent', async () => {
    const gemini = provider({});
    await expect(gemini.generate({}, 'safe-id')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('maps an aborted request to a gateway timeout', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(
      new DOMException('Timed out', 'TimeoutError'),
    );
    const gemini = provider({ GEMINI_API_KEY: 'test-key' });

    await expect(gemini.generate({}, 'safe-id')).rejects.toBeInstanceOf(
      GatewayTimeoutException,
    );
  });

  it('rejects invalid JSON output', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'not-json' }] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const gemini = provider({ GEMINI_API_KEY: 'test-key' });

    await expect(gemini.generate({}, 'safe-id')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('maps free-tier limits to HTTP 429', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'quota exceeded' } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const gemini = provider({ GEMINI_API_KEY: 'test-key' });

    await expect(gemini.generate({}, 'safe-id')).rejects.toMatchObject({
      status: 429,
    });
  });

  it('returns validated structured output and usage', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          responseId: 'gemini-response-1',
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(validOutput) }],
              },
            },
          ],
          usageMetadata: {
            promptTokenCount: 11,
            candidatesTokenCount: 22,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const gemini = provider({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-3.1-flash-lite',
    });

    await expect(gemini.generate({}, 'safe-id')).resolves.toEqual({
      output: validOutput,
      inputTokens: 11,
      outputTokens: 22,
      responseId: 'gemini-response-1',
    });
  });
});
