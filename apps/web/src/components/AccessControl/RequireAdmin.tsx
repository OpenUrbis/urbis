import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";

import { useAuth } from "@open-urbis/map-auth";

import { RestrictedAccess } from "./RestrictedAccess";

const ADMIN_ROLE_ID = "f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4";

type AdminCheckState = "checking" | "allowed" | "restricted";

interface RequireAdminProps {
  children: ReactNode;
}

interface UserRole {
  id?: string;
  name?: string;
}

interface UserRoleAssignment {
  role?: UserRole;
  id?: string;
  name?: string;
}

const isAdminRole = (role?: UserRole) => role?.id === ADMIN_ROLE_ID;

const getAssignmentRole = (assignment: UserRoleAssignment): UserRole =>
  assignment.role ?? { id: assignment.id, name: assignment.name };

const FullscreenLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
  </div>
);

export const RequireAdmin = ({ children }: RequireAdminProps) => {
  const auth = useAuth();
  const [adminCheckState, setAdminCheckState] =
    useState<AdminCheckState>("checking");

  useEffect(() => {
    if (auth.isLoading || auth.activeNavigator) {
      setAdminCheckState("checking");
      return;
    }

    if (!auth.isAuthenticated || !auth.user?.access_token) {
      setAdminCheckState("restricted");
      return;
    }

    const controller = new AbortController();
    const organizationHeaders: Record<string, string> = {};
    const storedOrganization =
      typeof window !== "undefined"
        ? window.localStorage.getItem("organization-seleted")
        : null;
    if (storedOrganization && storedOrganization !== "undefined") {
      try {
        const parsed = JSON.parse(storedOrganization);
        const organizationId =
          typeof parsed === "string"
            ? parsed
            : parsed?.id || parsed?.organizationId;
        if (organizationId) {
          organizationHeaders["x-organization-id"] = organizationId;
        }
      } catch {
        organizationHeaders["x-organization-id"] = storedOrganization;
      }
    }

    const checkAdminAccess = async () => {
      setAdminCheckState("checking");

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/auth/roles`,
          {
            headers: {
              Authorization: `Bearer ${auth.user?.access_token}`,
              ...organizationHeaders,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch user roles: ${response.status}`);
        }

        const roles = (await response.json()) as UserRoleAssignment[];
        const hasAdminRole = roles.some((assignment) =>
          isAdminRole(getAssignmentRole(assignment)),
        );

        setAdminCheckState(hasAdminRole ? "allowed" : "restricted");
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Failed to validate admin access", error);
        setAdminCheckState("restricted");
      }
    };

    void checkAdminAccess();

    return () => controller.abort();
  }, [auth.activeNavigator, auth.isAuthenticated, auth.isLoading, auth.user]);

  if (adminCheckState === "checking") {
    return <FullscreenLoader />;
  }

  if (adminCheckState === "restricted") {
    return <RestrictedAccess onLogin={() => void auth.signinRedirect()} />;
  }

  return <>{children}</>;
};
