import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPE_KEY, ScopeOptions } from '../decorators/scope.decorator';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const scopeOptions = this.reflector.getAllAndOverride<ScopeOptions>(SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!scopeOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const scopeId = request.params[scopeOptions.paramName];

    if (!user || !user.roles) {
      throw new ForbiddenException('Authentication required');
    }

    const hasScope = user.roles.some(
      (r: { role: string; scopeType: string; scopeId: string }) =>
        r.role === scopeOptions.role &&
        r.scopeType === scopeOptions.scopeType &&
        r.scopeId === scopeId,
    );

    if (!hasScope) {
      throw new ForbiddenException(`Not authorized for this ${scopeOptions.scopeType}`);
    }

    return true;
  }
}
