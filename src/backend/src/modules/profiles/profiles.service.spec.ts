import type { AuthUser } from '../../common/auth/auth-user.interface';
import { ProfilesService } from './profiles.service';

describe('ProfilesService', () => {
  it('always queries a profile using the authenticated user id', async () => {
    const eq = jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'user-a', role: 'customer' }, error: null }),
    });
    const client = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({ eq }),
      }),
    };
    const service = new ProfilesService({ createUserClient: jest.fn().mockReturnValue(client) } as never);
    const user: AuthUser = { id: 'user-a', role: 'customer', accessToken: 'jwt-a' };

    await service.getMine(user);

    expect(eq).toHaveBeenCalledWith('id', 'user-a');
  });
});
