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
  organizationId?: string;
}

export interface PermissionRequirement {
  id: string;
  scope?: RolePermissionScopeEnum | string;
  organizationId?: string;
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
    // Map key: permissionId -> list of { scope, organizationId }
    const map = new Map<
      string,
      { scope: RolePermissionScopeEnum; organizationId?: string }[]
    >();
    this.value().forEach((p) => {
      const current = map.get(p.id) || [];
      current.push({ scope: p.scope, organizationId: p.organizationId });
      map.set(p.id, current);
    });
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

    const result = this.hasPermissionInternal(reqs, mode, defaultScope);
    console.log('[URBIS PERM DEBUG]', {
      checking: reqs,
      result,
      allUserPermissions: Array.from(this.permissionMap().entries()),
    });
    return result;
  }

  private hasPermissionInternal(
    reqs: (string | PermissionRequirement)[],
    mode: 'AND' | 'OR',
    defaultScope: RolePermissionScopeEnum | string,
  ): boolean {
    const checkOne = (req: string | PermissionRequirement) => {
      const id = typeof req === 'string' ? req : req.id;
      const scope =
        typeof req === 'object' && req.scope ? req.scope : defaultScope;
      const organizationId =
        typeof req === 'object' ? req.organizationId : undefined;

      const userPermissions = this.permissionMap().get(id);
      if (!userPermissions || userPermissions.length === 0) return false;

      // Check if any of the user's permissions satisfy the requirement
      return userPermissions.some((userPerm) => {
        // If user has GLOBAL scope, it applies to all organizations, so bypass organizationId check
        if (userPerm.scope === RolePermissionScopeEnum.GLOBAL) {
          return true;
        }

        // If organization is required, check match
        if (organizationId && userPerm.organizationId !== organizationId) {
          return false;
        }

        if (userPerm.scope === RolePermissionScopeEnum.ANY) {
          return true;
        }

        return scope === RolePermissionScopeEnum.OWN;
      });
    };

    if (mode === 'AND') {
      return reqs.every(checkOne);
    } else {
      return reqs.some(checkOne);
    }
  }
}
