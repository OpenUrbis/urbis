import {
  AuthProvider as OidcProvider,
  hasAuthParams,
  useAuth,
} from "react-oidc-context";
import type { User, UserManager } from "oidc-client-ts";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { UserSync } from "./UserSync";
import {
  DEFAULT_AUTH_CALLBACK_RECOVERY_TIMEOUT_MS,
  recoverAuthFlow,
  resetAuthRecoveryAttempts,
} from "./auth-recovery";
import { AuthSessionContext, AuthSessionState } from "./auth-session";
import { getAuthCallbackPath } from "./oidc-config";

const DEFAULT_RETURN_TO = "/";

const isBrowser = () => typeof window !== "undefined";

/**
 * The post-login target travels through the OIDC `state`, which round-trips
 * through the identity provider. Only same-origin absolute paths are accepted so
 * a tampered `state` cannot turn the login flow into an open redirect.
 */
const sanitizeReturnTo = (value: unknown, callbackPath: string): string => {
  if (typeof value !== "string") return DEFAULT_RETURN_TO;
  if (!value.startsWith("/") || value.startsWith("//"))
    return DEFAULT_RETURN_TO;

  // Returning to the callback route itself would immediately re-run the
  // callback handling with no authorization response to process.
  if (value === callbackPath || value.startsWith(`${callbackPath}?`)) {
    return DEFAULT_RETURN_TO;
  }

  return value;
};

const getReturnTo = (user: User | undefined, callbackPath: string): string => {
  const state = user?.state;

  if (state && typeof state === "object" && "returnTo" in state) {
    return sanitizeReturnTo(
      (state as { returnTo?: unknown }).returnTo,
      callbackPath,
    );
  }

  return DEFAULT_RETURN_TO;
};

interface AuthCheckProps {
  children: ReactNode;
  userManager: UserManager;
  callbackPath: string;
  callbackRecoveryTimeoutMs?: number;
}

/**
 * Owns every automatic auth transition (session restore, callback watchdog and
 * recovery) so that no consumer needs to reimplement it. Each transition is
 * latched: a failing provider can trigger it at most once per page load, which
 * is what keeps the callback from looping.
 */
const AuthCheck = ({
  children,
  userManager,
  callbackPath,
  callbackRecoveryTimeoutMs = DEFAULT_AUTH_CALLBACK_RECOVERY_TIMEOUT_MS,
}: AuthCheckProps) => {
  const auth = useAuth();

  const isAuthCallbackRoute =
    isBrowser() && window.location.pathname === callbackPath;
  /** An authorization response is still in the URL, so the code exchange owns the flow. */
  const isProcessingAuthResponse = isBrowser() && hasAuthParams();

  const [isRestoringSession, setIsRestoringSession] = useState(
    () => !isAuthCallbackRoute && !isProcessingAuthResponse,
  );
  const [isAuthRecoveryExhausted, setIsAuthRecoveryExhausted] = useState(false);

  /**
   * Tracks the silent sign-in lifecycle in a ref (not state) because
   * `StrictMode` re-runs effects with the same render closure: a state latch
   * would be read as stale and let the request fire twice.
   */
  const silentSigninState = useRef<"idle" | "pending" | "settled">("idle");
  const recoveryStarted = useRef(false);

  useEffect(() => {
    if (auth.isAuthenticated) resetAuthRecoveryAttempts();
  }, [auth.isAuthenticated]);

  // Callback watchdog: recovers a stuck or failed authorization response.
  useEffect(() => {
    if (!isAuthCallbackRoute || auth.isAuthenticated) return;

    const recover = () => {
      if (recoveryStarted.current) return;
      recoveryStarted.current = true;

      void recoverAuthFlow({ userManager }).then((recovered) => {
        if (!recovered) setIsAuthRecoveryExhausted(true);
      });
    };

    if (auth.error) {
      recover();
      return;
    }

    // Nothing to finish: the route was opened without an authorization
    // response (bookmark, refresh after a completed login, ...).
    if (!auth.isLoading && !auth.activeNavigator && !isProcessingAuthResponse) {
      recover();
      return;
    }

    const timeoutId = window.setTimeout(recover, callbackRecoveryTimeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [
    auth.error,
    auth.isAuthenticated,
    auth.isLoading,
    auth.activeNavigator,
    isAuthCallbackRoute,
    isProcessingAuthResponse,
    userManager,
    callbackRecoveryTimeoutMs,
  ]);

  // Opportunistic session restore for anonymous visitors.
  useEffect(() => {
    // Never on the callback route: starting a second navigator while the
    // authorization code is being exchanged aborts the exchange, which then
    // triggers recovery and restarts the login redirect in a loop.
    if (isAuthCallbackRoute || isProcessingAuthResponse) {
      setIsRestoringSession(false);
      return;
    }

    if (auth.isAuthenticated) {
      setIsRestoringSession(false);
      return;
    }

    // Still in flight: guards must keep waiting instead of starting a redirect.
    if (silentSigninState.current === "pending") return;

    if (silentSigninState.current === "settled" || auth.error) {
      setIsRestoringSession(false);
      return;
    }

    // The provider is still initialising or another navigator owns the flow.
    if (auth.isLoading || auth.activeNavigator) return;

    silentSigninState.current = "pending";

    void auth
      .signinSilent()
      .catch(() => {
        // No session at the provider: the user simply stays anonymous.
      })
      .finally(() => {
        silentSigninState.current = "settled";
        setIsRestoringSession(false);
      });
  }, [auth, isAuthCallbackRoute, isProcessingAuthResponse]);

  const sessionState = useMemo<AuthSessionState>(
    () => ({
      isRestoringSession,
      isAuthCallbackRoute,
      isAuthRecoveryExhausted,
    }),
    [isRestoringSession, isAuthCallbackRoute, isAuthRecoveryExhausted],
  );

  return (
    <AuthSessionContext.Provider value={sessionState}>
      {children}
    </AuthSessionContext.Provider>
  );
};

export interface AuthProviderProps {
  children: ReactNode;
  userManager: UserManager;
  apiUrl: string;
  callbackRecoveryTimeoutMs?: number;
}

export const AuthProvider = ({
  children,
  userManager,
  apiUrl,
  callbackRecoveryTimeoutMs,
}: AuthProviderProps) => {
  const callbackPath = useMemo(
    () => getAuthCallbackPath(userManager?.settings?.redirect_uri),
    [userManager],
  );

  const onSigninCallback = useCallback(
    (user: User | undefined) => {
      resetAuthRecoveryAttempts();

      // A full navigation (rather than a history push) guarantees the app boots
      // without the authorization response still in the URL.
      window.location.replace(getReturnTo(user, callbackPath));
    },
    [callbackPath],
  );

  return (
    <OidcProvider userManager={userManager} onSigninCallback={onSigninCallback}>
      <AuthCheck
        userManager={userManager}
        callbackPath={callbackPath}
        callbackRecoveryTimeoutMs={callbackRecoveryTimeoutMs}
      >
        <UserSync apiUrl={apiUrl} />
        {children}
      </AuthCheck>
    </OidcProvider>
  );
};
