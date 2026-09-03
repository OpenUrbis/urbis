import { SYSTEM_ROLES } from 'common/constants/system-roles.const';

type RoleAssignmentLike = {
  roleId?: string;
  role?: { id?: string };
};

/**
 * Minimal shape of the authenticated user needed by Legis write operations.
 */
export type LegisActor = {
  id?: string;
  userRoleAssignments?: RoleAssignmentLike[];
};

export const isLegisAdmin = (actor?: LegisActor | null): boolean =>
  Boolean(
    actor?.userRoleAssignments?.some(
      (assignment) =>
        assignment?.roleId === SYSTEM_ROLES.admin ||
        assignment?.role?.id === SYSTEM_ROLES.admin,
    ),
  );
