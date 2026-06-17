import { SetMetadata } from '@nestjs/common';

export interface ScopeOptions {
  scopeType: string;
  paramName: string;
  role: string;
}

export const SCOPE_KEY = 'scope';
export const Scope = (options: ScopeOptions) => SetMetadata(SCOPE_KEY, options);
