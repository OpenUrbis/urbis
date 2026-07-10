export enum RolePermissionScopeEnum {
  GLOBAL = 'global',
  ANY = 'any',
  OWN = 'own',
}

export interface IAccessControlPermission {
  id: string;
  resource: string;
  action: string;
  scope: RolePermissionScopeEnum;
}

export interface AccessControlOptions {
  permissions: IAccessControlPermission | IAccessControlPermission[];
  mode?: 'AND' | 'OR'; // Default: 'AND'
}

export class AccessControl {
  private _permissions: IAccessControlPermission[] = [];

  get permissions(): IAccessControlPermission[] {
    return this._permissions;
  }

  constructor(permissions: IAccessControlPermission[]) {
    this._permissions = Array.isArray(permissions) ? permissions : [];
  }

  private hasSinglePermission(req: IAccessControlPermission): boolean {
    return this._permissions.some(
      (prm) =>
        (prm.id === req.id ||
          (prm.resource === req.resource && prm.action === req.action) ||
          prm.id === `${req.resource}:${req.action}`) &&
        this.isScopeCompatible(prm.scope, req.scope),
    );
  }

  private isScopeCompatible(
    userScope: RolePermissionScopeEnum,
    requiredScope: RolePermissionScopeEnum,
  ): boolean {
    if (
      userScope === RolePermissionScopeEnum.GLOBAL ||
      userScope === RolePermissionScopeEnum.ANY
    )
      return true;
    return userScope === requiredScope;
  }

  hasPermission(options: AccessControlOptions): boolean {
    const mode = options.mode || 'AND';
    const requirements = Array.isArray(options.permissions)
      ? options.permissions
      : [options.permissions];

    if (mode === 'AND') {
      return requirements.every((req) => this.hasSinglePermission(req));
    } else if (mode === 'OR') {
      return requirements.some((req) => this.hasSinglePermission(req));
    }
    return false;
  }
}
