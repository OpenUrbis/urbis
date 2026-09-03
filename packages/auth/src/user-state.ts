import { computed, signal } from "@preact/signals";
import { AccessControl, IAccessControlPermission } from "./access-control";

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  position?: string;
  [key: string]: any;
}

export interface UserRole {
  id?: string;
  name?: string;
}

export interface UserRoleAssignment {
  role?: UserRole;
}

const ADMIN_ROLE_ID = "f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4";

const isAdminRole = (role?: UserRole) => role?.id === ADMIN_ROLE_ID;

export const userProfile = signal<UserProfile | null>(null);
export const userPermissions = signal<IAccessControlPermission[]>([]);
export const userRoles = signal<UserRoleAssignment[]>([]);
export const userRolesLoaded = signal(false);

export const isAdminUser = computed(() => {
  const hasAdminRole = userRoles.value.some((assignment) =>
    isAdminRole(assignment.role),
  );

  return hasAdminRole;
});

export const accessControl = computed(
  () => new AccessControl(userPermissions.value),
);
