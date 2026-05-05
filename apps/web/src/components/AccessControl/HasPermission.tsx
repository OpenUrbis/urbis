import { ReactNode } from 'react';
import { accessControl } from '../../auth/user-state';
import { AccessControlOptions } from '../../utils/access-control';

interface HasPermissionProps extends AccessControlOptions {
  children: ReactNode;
  fallback?: ReactNode;
}

export const HasPermission = ({
  children,
  fallback = null,
  ...options
}: HasPermissionProps) => {
  const hasPermission = accessControl.value.hasPermission(options);

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};
