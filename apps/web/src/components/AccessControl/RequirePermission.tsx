import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { accessControl } from "../../auth/user-state";
import { AccessControlOptions } from "../../utils/access-control";

interface RequirePermissionProps extends AccessControlOptions {
  children: ReactNode;
  redirectTo?: string;
}

export const RequirePermission = ({
  children,
  redirectTo = "~/",
  ...options
}: RequirePermissionProps) => {
  const hasPermission = accessControl.value.hasPermission(options);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!hasPermission) {
      setLocation(redirectTo);
    }
  }, [hasPermission, setLocation, redirectTo]);

  if (hasPermission) {
    return <>{children}</>;
  }

  return null;
};
