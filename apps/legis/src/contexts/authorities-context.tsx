import React from "react";
import type { Authority } from "../domain/entities";
import { authorityService } from "../services/authority-service";

interface AuthoritiesContextValue {
  authorities: Authority[];
  isLoading: boolean;
  getAuthorityById: (authorityId?: string) => Authority | undefined;
}

export const AuthoritiesContext = React.createContext<
  AuthoritiesContextValue | undefined
>(undefined);

export function AuthoritiesProvider({ children }: React.PropsWithChildren) {
  const [authorities, setAuthorities] = React.useState<Authority[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const loadAuthorities = async () => {
      try {
        const loadedAuthorities = await authorityService.list();

        if (isMounted) {
          setAuthorities(loadedAuthorities);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAuthorities();

    return () => {
      isMounted = false;
    };
  }, []);

  const authorityMap = React.useMemo(
    () => new Map(authorities.map((authority) => [authority.id, authority])),
    [authorities],
  );

  const getAuthorityById = React.useCallback(
    (authorityId?: string) =>
      authorityId ? authorityMap.get(authorityId) : undefined,
    [authorityMap],
  );

  const value = React.useMemo(
    () => ({
      authorities,
      isLoading,
      getAuthorityById,
    }),
    [authorities, getAuthorityById, isLoading],
  );

  return (
    <AuthoritiesContext.Provider value={value}>
      {children}
    </AuthoritiesContext.Provider>
  );
}

export function useAuthorities() {
  const context = React.useContext(AuthoritiesContext);

  if (!context) {
    throw new Error(
      "useAuthorities must be used within an AuthoritiesProvider",
    );
  }

  return context;
}
