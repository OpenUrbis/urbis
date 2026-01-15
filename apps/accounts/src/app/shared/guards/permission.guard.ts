import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { PermissionState } from '../../states/permission/permission.state';
import { RolePermissionScopeEnum } from '../enums/role-permission-scope.enum';

export const permissionGuard: CanActivateFn = (route, state) => {
  const permissionState = inject(PermissionState);
  const router = inject(Router);
  const requiredPermission = route.data['permission'] as string | string[];
  const requiredScope = route.data['scope'] as RolePermissionScopeEnum | string;
  const mode = (route.data['mode'] as 'AND' | 'OR') || 'AND';

  if (!requiredPermission) return true;

  return toObservable(permissionState.loading).pipe(
    filter((loading) => !loading),
    take(1),
    map(() => {
      if (
        permissionState.hasPermission(requiredPermission, mode, requiredScope)
      ) {
        return true;
      }
      return false;
    }),
  );
};
