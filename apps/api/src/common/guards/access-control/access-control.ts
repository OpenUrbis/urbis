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
}

export interface AccessControlOptions {
  permissions:
    | Partial<IAccessControlPermission>
    | Partial<IAccessControlPermission>[];
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
              organizationId: assignment.organizationId,
            }),
          ),
        );
      }

      if (organization) this._organizations.add(organization);
    });
  }

  private hasSinglePermission(req: Partial<IAccessControlPermission>): boolean {
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
    requiredScope?: RolePermissionScopeEnum,
  ): boolean {
    if (!requiredScope) return true;

    if (userScope === RolePermissionScopeEnum.GLOBAL) return true;

    if (userScope === RolePermissionScopeEnum.ANY) {
      return (
        requiredScope === RolePermissionScopeEnum.ANY ||
        requiredScope === RolePermissionScopeEnum.OWN
      );
    }

    if (userScope === RolePermissionScopeEnum.OWN) {
      return requiredScope === RolePermissionScopeEnum.OWN;
    }

    return false;
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

  public addOrganizations(orgs: Organization[]) {
    orgs.forEach((o) => this._organizations.add(o));
  }

  private getDescendantsOf(rootId: string): string[] {
    const descendants: string[] = [];
    const queue = [rootId];
    // Build adjacency list from current organizations
    const childrenMap = new Map<string, string[]>();
    this.organizations.forEach((o) => {
      if (o.parentId) {
        if (!childrenMap.has(o.parentId)) childrenMap.set(o.parentId, []);
        childrenMap.get(o.parentId).push(o.id);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift();
      const children = childrenMap.get(current);
      if (children) {
        descendants.push(...children);
        queue.push(...children);
      }
    }
    return descendants;
  }

  private getRootOf(id: string): string {
    let currentId = id;
    const parentMap = new Map<string, string>();
    this.organizations.forEach((o) => {
      if (o.parentId) parentMap.set(o.id, o.parentId);
    });

    const visited = new Set<string>();
    while (parentMap.has(currentId)) {
      if (visited.has(currentId)) break;
      visited.add(currentId);
      currentId = parentMap.get(currentId)!;
    }
    return currentId;
  }

  getContextualOrganizations(options?: AccessControlOptions): Organization[] {
    if (!options || !options.permissions) return this.organizations;

    const mode = options.mode || 'AND';
    const requirements = Array.isArray(options.permissions)
      ? options.permissions
      : [options.permissions];

    if (requirements.length === 0) return this.organizations;

    // Helper to get allowed org IDs for a single requirement
    const getAllowedOrgIdsForRequirement = (
      req: Partial<IAccessControlPermission>,
    ): Set<string> => {
      const allowed = new Set<string>();

      for (const prm of this._permissions) {
        // Check match
        const isMatch =
          prm.id === req.id ||
          (prm.resource === req.resource && prm.action === req.action) ||
          prm.id === `${req.resource}:${req.action}`;

        if (isMatch && this.isScopeCompatible(prm.scope, req.scope)) {
          if (!prm.organizationId) {
            allowed.add('ALL');
          } else if (prm.scope === RolePermissionScopeEnum.GLOBAL) {
            const root = this.getRootOf(prm.organizationId);
            allowed.add(root);
            const descendants = this.getDescendantsOf(root);
            descendants.forEach((d) => allowed.add(d));
          } else {
            allowed.add(prm.organizationId);
            // If scope is ANY, expand hierarchy
            if (prm.scope === RolePermissionScopeEnum.ANY) {
              const descendants = this.getDescendantsOf(prm.organizationId);
              descendants.forEach((d) => allowed.add(d));
            }
          }
        }
      }
      return allowed;
    };

    if (mode === 'OR') {
      const finalIds = new Set<string>();
      let allAccess = false;
      for (const req of requirements) {
        const allowed = getAllowedOrgIdsForRequirement(req);
        if (allowed.has('ALL')) allAccess = true;
        allowed.forEach((id) => {
          if (id !== 'ALL') finalIds.add(id);
        });
      }
      if (allAccess) return this.organizations;
      return this.organizations.filter((o) => finalIds.has(o.id));
    } else {
      // AND - Intersection
      let intersectionIds: Set<string> | null = null;

      for (const req of requirements) {
        const allowed = getAllowedOrgIdsForRequirement(req);
        const hasAll = allowed.has('ALL');

        const currentIds = new Set<string>();
        if (hasAll) {
          this.organizations.forEach((o) => currentIds.add(o.id));
        } else {
          allowed.forEach((id) => {
            if (id !== 'ALL') currentIds.add(id);
          });
        }

        if (intersectionIds === null) {
          intersectionIds = currentIds;
        } else {
          intersectionIds = new Set(
            [...intersectionIds].filter((x) => currentIds.has(x)),
          );
        }
      }

      if (!intersectionIds) return [];
      return this.organizations.filter((o) => intersectionIds!.has(o.id));
    }
  }

  hasOrganization(orgId: string): boolean {
    return this.organizations.some((organization) => organization.id === orgId);
  }
}
