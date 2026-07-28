import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiAssistantProvider } from './gemini-assistant.provider';

function provider(values: Record<string, unknown>) {
  return new GeminiAssistantProvider({
    get: (key: string) => values[key],
  } as ConfigService);
}

describe('GeminiAssistantProvider', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects requests when the server key is missing', async () => {
    const gemini = provider({});
    await expect(gemini.generate([], 'Xin chào', {})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('returns generated text and usage metadata', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Chào bạn!' }] } }],
          usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 5 },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const gemini = provider({
      GEMINI_API_KEY: 'test-key',
      GEMINI_MODEL: 'gemini-3.1-flash-lite',
    });

    await expect(
      gemini.generate([], 'Xin chào', { assistantName: 'Mầm Xanh' }),
    ).resolves.toEqual({
      content: 'Chào bạn!',
      inputTokens: 12,
      outputTokens: 5,
    });
    const request = fetchSpy.mock.calls[0]?.[1];
    expect(typeof request?.body).toBe('string');
    const body = JSON.parse(request?.body as string) as {
      system_instruction: { parts: Array<{ text: string }> };
    };
    expect(body.system_instruction.parts[0]?.text).toContain(
      'Tên hiển thị của bạn là "Mầm Xanh"',
    );
  });

  it('maps free-tier quota errors to HTTP 429', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'quota exceeded' } }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const gemini = provider({ GEMINI_API_KEY: 'test-key' });

    await expect(gemini.generate([], 'Xin chào', {})).rejects.toMatchObject({
      status: 429,
    });
  });
});
