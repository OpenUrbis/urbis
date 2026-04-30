import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export function OrGuard(...guards: Type<CanActivate>[]): Type<CanActivate> {
  @Injectable()
  class OrGuardMixin implements CanActivate {
    constructor(private moduleRef: ModuleRef) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      for (const Guard of guards) {
        try {
          const guard = this.moduleRef.get(Guard, { strict: false });
          if (!guard) continue;
          const result = await guard.canActivate(context);
          if (result === true) {
            return true;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Ignora o erro e tenta o próximo guard
          continue;
        }
      }
      return false; // Nenhum guard passou
    }
  }
  return mixin(OrGuardMixin);
}
