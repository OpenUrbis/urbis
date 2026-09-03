import { hasAuthParams, useAuth } from "react-oidc-context";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useAuthSession } from "./auth-session";

const getCurrentReturnTo = () => {
  if (typeof window === "undefined") return "/";

  const { pathname, search, hash } = window.location;

  return `${pathname}${search}${hash}`;
};

export interface RequireAuthProps {
  children: ReactNode;
  /** Rendered while the session is being resolved or the redirect is starting. */
  fallback?: ReactNode;
  /** Rendered when sign-in failed and no further attempt will be made. */
  errorFallback?: ReactNode;
}

/**
 * Redirects anonymous visitors to the identity provider, at most once per page
 * load. The latch matters: without it a provider that keeps returning an error
 * makes this guard redirect on every state update, which is indistinguishable
 * from an infinite login loop.
 */
export const RequireAuth = ({
  children,
  fallback = null,
  errorFallback,
}: RequireAuthProps) => {
  const auth = useAuth();
  const { isRestoringSession, isAuthCallbackRoute } = useAuthSession();
  /**
   * Ref, not state: `StrictMode` re-runs effects with the same render closure,
   * so a state latch would be read as stale and issue two redirects.
   */
  const signinRequested = useRef(false);
  const [signinFailed, setSigninFailed] = useState(false);

  useEffect(() => {
    // The provider owns the callback route and any in-flight authorization
    // response; redirecting from here would discard the authorization code.
    if (isAuthCallbackRoute) return;
    if (typeof window !== "undefined" && hasAuthParams()) return;

    if (isRestoringSession) return;
    if (auth.isLoading || auth.activeNavigator || auth.isAuthenticated) return;

    if (signinRequested.current) {
      // The single allowed attempt is over and the user is still anonymous.
      if (auth.error) setSigninFailed(true);
      return;
    }

    signinRequested.current = true;

    void auth.signinRedirect({ state: { returnTo: getCurrentReturnTo() } });
  }, [auth, isRestoringSession, isAuthCallbackRoute]);

  if (auth.isAuthenticated) return <>{children}</>;

  if (signinFailed && errorFallback) return <>{errorFallback}</>;

  return <>{fallback}</>;
};
