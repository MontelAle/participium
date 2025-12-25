import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let context: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as unknown as ExecutionContext;
  });

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if no user or role is present', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const requestMock: { user: any } = { user: null };
    (context.switchToHttp().getRequest as jest.Mock).mockReturnValue(
      requestMock,
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user role is not allowed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const requestMock = { user: { role: { name: 'user' } } };
    (context.switchToHttp().getRequest as jest.Mock).mockReturnValue(
      requestMock,
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user role is allowed', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const requestMock = { user: { role: { name: 'admin' } } };
    (context.switchToHttp().getRequest as jest.Mock).mockReturnValue(
      requestMock,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if requiredRoles array is empty', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const requestMock = { user: { role: { name: 'user' } } };
    (context.switchToHttp().getRequest as jest.Mock).mockReturnValue(
      requestMock,
    );

    expect(guard.canActivate(context)).toBe(true);
  });
});
