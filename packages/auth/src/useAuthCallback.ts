import { useAuth } from "react-oidc-context";
import { useAuthSession } from "./auth-session";

export type AuthCallbackStatus = "processing" | "authenticated" | "failed";

export interface AuthCallbackState {
  status: AuthCallbackStatus;
  error?: ReturnType<typeof useAuth>["error"];
}

/**
 * State for a `/callback` page.
 *
 * The page is intentionally passive: finishing the code exchange, redirecting on
 * success and recovering from failures all happen once, inside `AuthProvider`.
 * Reimplementing any of that in the page duplicates the recovery redirect and
 * clears the OIDC state while the exchange is still running — the classic
 * callback loop.
 */
export const useAuthCallback = (): AuthCallbackState => {
  const auth = useAuth();
  const { isAuthRecoveryExhausted } = useAuthSession();

  if (auth.isAuthenticated) return { status: "authenticated" };

  if (isAuthRecoveryExhausted) {
    return { status: "failed", error: auth.error };
  }

  return { status: "processing" };
};
