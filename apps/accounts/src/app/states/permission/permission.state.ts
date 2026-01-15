import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthState } from '../auth/auth.state';
import { RolePermissionScopeEnum } from '../../shared/enums/role-permission-scope.enum';

export interface PermissionDto {
  id: string;
  scope: RolePermissionScopeEnum;
}

export interface PermissionRequirement {
  id: string;
  scope?: RolePermissionScopeEnum | string;
}

@Injectable({ providedIn: 'root' })
export class PermissionState {
  private http = inject(HttpClient);
  private auth = inject(AuthState);

  private permissionResource = rxResource({
    params: () => ({ isAuthenticated: this.auth.isAuthenticated() }),
    stream: ({ params }) => {
      if (!params.isAuthenticated) return of([] as PermissionDto[]);
      return this.http.get<PermissionDto[]>(
        `${environment.api}/auth/permissions`,
      );
    },
    defaultValue: [] as PermissionDto[],
  });

  loading = computed(() => this.permissionResource.isLoading());
  value = computed(() => this.permissionResource.value() || []);
  errors = computed(() => this.permissionResource.error());

  permissionMap = computed(() => {
    const map = new Map<string, RolePermissionScopeEnum>();
    this.value().forEach((p) => map.set(p.id, p.scope));
    return map;
  });

  refresh() {
    this.permissionResource.reload();
  }

  hasPermission(
    requirements:
      | string
      | string[]
      | PermissionRequirement
      | PermissionRequirement[],
    mode: 'AND' | 'OR' = 'AND',
    defaultScope:
      | RolePermissionScopeEnum
      | string = RolePermissionScopeEnum.OWN,
  ): boolean {
    const reqs = Array.isArray(requirements) ? requirements : [requirements];

    const checkOne = (req: string | PermissionRequirement) => {
      const id = typeof req === 'string' ? req : req.id;
      const scope =
        typeof req === 'object' && req.scope ? req.scope : defaultScope;

      const userScope = this.permissionMap().get(id);
      if (!userScope) return false;

      if (
        userScope === RolePermissionScopeEnum.GLOBAL ||
        userScope === RolePermissionScopeEnum.ANY
      ) {
        return true;
      }

      return scope === RolePermissionScopeEnum.OWN;
    };

    if (mode === 'AND') {
      return reqs.every(checkOne);
    } else {
      return reqs.some(checkOne);
    }
  }
}
