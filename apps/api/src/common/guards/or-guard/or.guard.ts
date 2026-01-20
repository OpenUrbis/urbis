import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  Type,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

export function OrGuard(...guards: Type<CanActivate>[]): Type<CanActivate> {
  @Injectable()
  class OrGuardMixin implements CanActivate {
    constructor(private moduleRef: ModuleRef) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      let firstError: any;
      let priorityError: any;

      for (let i = 0; i < guards.length; i++) {
        const Guard = guards[i];
        try {
          const guard = this.moduleRef.get(Guard, { strict: false });
          if (!guard) continue;
          const result = await guard.canActivate(context);
          if (result === true) {
            return true;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          if (error instanceof ForbiddenException) {
            priorityError = error;
          }
          if (i === 0) {
            firstError = error;
          }
          // Ignora o erro e tenta o próximo guard
          continue;
        }
      }

      if (priorityError) {
        throw priorityError;
      }

      if (firstError) {
        throw firstError;
      }

      throw new UnauthorizedException();
    }
  }
  return mixin(OrGuardMixin);
}
