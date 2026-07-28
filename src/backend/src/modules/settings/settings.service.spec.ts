import { SettingsService } from './settings.service';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'customer@example.com',
  role: 'customer' as const,
  accessToken: 'access-token',
};

function query(result: { data: unknown; error: unknown }) {
  const chain = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue(result),
    upsert: jest.fn(),
    single: jest.fn().mockResolvedValue(result),
  };
  chain.select.mockReturnValue(chain);
  chain.eq.mockReturnValue(chain);
  chain.upsert.mockReturnValue(chain);
  return chain;
}

describe('SettingsService', () => {
  it('returns the default assistant name when no settings row exists', async () => {
    const table = query({ data: null, error: null });
    const service = new SettingsService({
      getAdminClient: () => ({ from: () => table }),
    } as never);

    await expect(service.get(user)).resolves.toEqual({
      assistantName: 'Nutri',
      updatedAt: null,
    });
  });

  it('upserts settings only for the authenticated user id', async () => {
    const table = query({
      data: {
        assistant_name: 'Mầm Xanh',
        updated_at: '2026-07-28T00:00:00.000Z',
      },
      error: null,
    });
    const service = new SettingsService({
      getAdminClient: () => ({ from: () => table }),
    } as never);

    await expect(
      service.update(user, { assistantName: 'Mầm Xanh' }),
    ).resolves.toMatchObject({ assistantName: 'Mầm Xanh' });
    expect(table.upsert).toHaveBeenCalledWith(
      {
        user_id: user.id,
        assistant_name: 'Mầm Xanh',
      },
      { onConflict: 'user_id' },
    );
  });
});
