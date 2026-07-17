import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import type { AuthUser } from '../auth/auth-user.interface';

export const CurrentUser = createParamDecorator(
  (key: keyof AuthUser | undefined, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    return key ? user[key] : user;
  },
);
