import { createContext, useContext } from "react";

export interface AuthSessionState {
  /**
   * True while an existing provider session is being probed through a silent
   * sign-in. Guards must wait for this to settle, otherwise they start a second
   * (redirect) navigator while the silent one is still running.
   */
  isRestoringSession: boolean;
  /** True when the current URL is the configured OIDC redirect route. */
  isAuthCallbackRoute: boolean;
  /**
   * True when the callback failed and the recovery budget was exhausted. The
   * flow is deliberately stopped here so the user sees an error instead of an
   * endless redirect loop.
   */
  isAuthRecoveryExhausted: boolean;
}

export const DEFAULT_AUTH_SESSION_STATE: AuthSessionState = {
  isRestoringSession: false,
  isAuthCallbackRoute: false,
  isAuthRecoveryExhausted: false,
};

export const AuthSessionContext = createContext<AuthSessionState>(
  DEFAULT_AUTH_SESSION_STATE,
);

export const useAuthSession = () => useContext(AuthSessionContext);
