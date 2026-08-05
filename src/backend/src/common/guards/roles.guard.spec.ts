import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../auth/authenticated-request.interface';
import { RolesGuard } from './roles.guard';

function contextFor(role: 'customer' | 'kitchen_staff' | 'admin') {
  const request = { user: { role } } as AuthenticatedRequest;
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows an account with one of the required roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['kitchen_staff', 'admin']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(contextFor('kitchen_staff'))).toBe(true);
  });

  it('rejects a customer from a privileged endpoint', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['admin']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(contextFor('customer'))).toThrow(ForbiddenException);
  });
});
