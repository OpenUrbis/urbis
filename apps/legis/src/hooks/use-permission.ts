import { isAdminUser, userRolesLoaded, useAuth } from "@open-urbis/map-auth";
import { effect } from "@preact/signals";
import { useEffect, useState } from "react";

export function usePermission() {
  const auth = useAuth();
  const [admin, setAdmin] = useState(isAdminUser.value);
  const [rolesLoaded, setRolesLoaded] = useState(userRolesLoaded.value);

  useEffect(() => {
    const dispose = effect(() => {
      // Reading both signals keeps this hook synchronized with the API-loaded
      // role assignments rather than with stale OIDC claims or role names.
      setAdmin(isAdminUser.value);
      setRolesLoaded(userRolesLoaded.value);
    });
    return () => dispose();
  }, []);

  const isAuthLoading = auth.isLoading;
  const isAuthenticated = auth.isAuthenticated;
  const isLoading = isAuthLoading || (isAuthenticated && !rolesLoaded);
  const isAdmin = Boolean(isAuthenticated && admin);

  return {
    isAdmin,
    canEdit: isAdmin,
    canDelete: isAdmin,
    canCreate: isAdmin,
    isLoading,
  };
}
