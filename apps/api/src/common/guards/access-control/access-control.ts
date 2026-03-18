import { Organization } from 'organization/entities/organization.entity';
import { Role } from 'role/entities/role.entity';
import { UserRoleAssignment } from 'role/entities/user-role-assignment.entity';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';

export interface IAccessControlPermission {
  id: string;
  resource: string;
  action: string;
  scope: RolePermissionScopeEnum;
  organizationId?: string;
  exactScope?: boolean;
}

export interface AccessControlOptions {
  permissions: IAccessControlPermission | IAccessControlPermission[];
  mode?: 'AND' | 'OR'; // Default: 'AND'
}

export type IAccessControlPermissionWithId = Pick<
  IAccessControlPermission,
  'id' | 'scope'
>;
export type IAccessControlPermissionWithResourceAndAction = Pick<
  IAccessControlPermission,
  'resource' | 'action' | 'scope'
>;
export type IAccessControlPermissionCoditional =
  | IAccessControlPermissionWithId
  | IAccessControlPermissionWithResourceAndAction;

export interface IRequiredPermissionOptions {
  permissions:
    | Partial<IAccessControlPermissionCoditional>
    | Partial<IAccessControlPermissionCoditional>[];
  mode?: 'AND' | 'OR'; // Default: 'AND'
}

export class AccessControl {
  private _roles: Set<Role> = new Set(); // Usamos Set para evitar duplicatas
  private _organizations: Set<Organization> = new Set(); // Usamos Set para evitar duplicatas
  private _permissions: IAccessControlPermission[] = [];

  get roles(): Role[] {
    return Array.from(this._roles);
  }

  get organizations(): Organization[] {
    return Array.from(this._organizations);
  }

  get permissions(): IAccessControlPermission[] {
    return this._permissions;
  }

  constructor(userAssignments: UserRoleAssignment[]) {
    userAssignments.forEach((assignment) => {
      const role = assignment.role;
      const organization = assignment.organization;

      if (role) {
        this._roles.add(role);
        this._permissions.push(
          ...role.rolePermissions.map(
            (rp): IAccessControlPermission => ({
              id: rp.permission.id,
              resource: rp.permission.resource,
              action: rp.permission.action,
              scope: rp.scope,
              organizationId: organization?.id,
            }),
          ),
        );
      }

      if (organization) this._organizations.add(organization);
    });
  }

  private hasSinglePermission(req: IAccessControlPermission): boolean {
    return this._permissions.some((prm) => {
      const matchesAction =
        prm.id === req.id ||
        (prm.resource === req.resource && prm.action === req.action) ||
        prm.id === `${req.resource}:${req.action}`;

      if (!matchesAction) return false;

      const isScopeOk = this.isScopeCompatible(
        prm.scope,
        req.scope,
        req.exactScope,
      );
      if (!isScopeOk) return false;

      if (req.organizationId) {
        if (prm.organizationId !== req.organizationId) {
          return false;
        }
      }

      return true;
    });
  }

  private isScopeCompatible(
    userScope: RolePermissionScopeEnum,
    requiredScope: RolePermissionScopeEnum,
    exactScope?: boolean,
  ): boolean {
    if (exactScope) {
      return userScope === requiredScope;
    }
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

  hasOrganization(orgId: string): boolean {
    return this.organizations.some((organization) => organization.id === orgId);
  }
}
