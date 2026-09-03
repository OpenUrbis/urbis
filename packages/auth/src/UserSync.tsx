import { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { identifyUser, resetUser } from "@open-urbis/map-shared";
import {
  userPermissions,
  userProfile,
  userRoles,
  userRolesLoaded,
  type UserRoleAssignment,
} from "./user-state";

interface UserSyncProps {
  apiUrl: string;
}

export const UserSync = ({ apiUrl }: UserSyncProps) => {
  const auth = useAuth();

  useEffect(() => {
    if (auth.isAuthenticated && auth.user) {
      userProfile.value = {
        id: auth.user.profile.sub,
        name: auth.user.profile.name,
        email: auth.user.profile.email,
        ...auth.user.profile,
      };

      identifyUser(auth.user.profile.sub, {
        email: auth.user.profile.email,
        name: auth.user.profile.name,
      });

      const organizationHeader = (() : Record<string, string> => {
        if (typeof window === "undefined") return {};
        const stored = window.localStorage.getItem("organization-seleted");
        if (!stored || stored === "undefined") return {};
        try {
          const parsed = JSON.parse(stored);
          const id =
            typeof parsed === "string"
              ? parsed
              : parsed?.id || parsed?.organizationId;
          return id ? { "x-organization-id": id } : {};
        } catch {
          return { "x-organization-id": stored };
        }
      })();

      const authHeaders = {
        Authorization: `Bearer ${auth.user.access_token}`,
        ...organizationHeader,
      };

      fetch(`${apiUrl}/auth/permissions`, {
        headers: authHeaders,
      })
        .then((res) => res.json())
        .then((permissions) => {
          userPermissions.value = permissions;
        })
        .catch((err) => {
          console.error("Failed to fetch permissions", err);
          userPermissions.value = [];
        });

      fetch(`${apiUrl}/auth/roles`, {
        headers: authHeaders,
      })
        .then((res) => res.json())
        .then((roles: UserRoleAssignment[]) => {
          userRoles.value = roles;
          userRolesLoaded.value = true;

          const mainRole =
            roles.find(
              (assignment) =>
                assignment.role?.id === "f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4",
            )?.role?.name ?? roles[0]?.role?.name;

          if (mainRole && userProfile.value) {
            userProfile.value = {
              ...userProfile.value,
              position: mainRole,
            };
          }
        })
        .catch((err) => {
          console.error("Failed to fetch roles", err);
          userRoles.value = [];
          userRolesLoaded.value = true;
        });
    } else {
      userProfile.value = null;
      userPermissions.value = [];
      userRoles.value = [];
      userRolesLoaded.value = false;
      resetUser();
    }
  }, [auth.isAuthenticated, auth.user, apiUrl]);

  return null;
};
