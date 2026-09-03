import type { UserManager } from "oidc-client-ts";

/**
 * `oidc-client-ts` namespaces everything it persists (transient sign-in state
 * and the user itself) under this prefix. Matching anything broader — such as
 * the substrings "user" or "authority" — would also wipe unrelated application
 * state that happens to contain those words.
 */
const OIDC_STORAGE_KEY_PREFIX = "oidc.";

const RECOVERY_ATTEMPTS_KEY = "urbis.auth.recovery-attempts";

export const DEFAULT_AUTH_CALLBACK_RECOVERY_TIMEOUT_MS = 12000;

/**
 * Recovering restarts the login flow, so it has to be bounded. A permanently
 * failing callback (misconfigured client, wrong redirect URI, clock skew)
 * would otherwise bounce the browser between the app and the identity
 * provider forever.
 */
export const DEFAULT_MAX_AUTH_RECOVERY_ATTEMPTS = 2;

const getSessionStorage = (): Storage | undefined => {
  if (typeof window === "undefined") return undefined;

  try {
    return window.sessionStorage;
  } catch {
    // Storage can be blocked (private mode, third-party context).
    return undefined;
  }
};

/**
 * Attempts are tracked in `sessionStorage` on purpose: recovery performs a full
 * page navigation, so an in-memory counter would reset on every hop and never
 * break the loop.
 */
export const getAuthRecoveryAttempts = (): number => {
  const raw = getSessionStorage()?.getItem(RECOVERY_ATTEMPTS_KEY);
  const parsed = Number.parseInt(raw ?? "", 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const resetAuthRecoveryAttempts = () => {
  try {
    getSessionStorage()?.removeItem(RECOVERY_ATTEMPTS_KEY);
  } catch (error) {
    console.warn("Failed to reset auth recovery attempts", error);
  }
};

const setAuthRecoveryAttempts = (attempts: number) => {
  try {
    getSessionStorage()?.setItem(RECOVERY_ATTEMPTS_KEY, String(attempts));
  } catch (error) {
    console.warn("Failed to persist auth recovery attempts", error);
  }
};

const clearMatchingStorage = (storage: Storage | undefined) => {
  if (!storage) return;

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);

    if (key?.startsWith(OIDC_STORAGE_KEY_PREFIX)) {
      storage.removeItem(key);
    }
  }
};

export const clearAuthFlowState = async (userManager?: UserManager | null) => {
  try {
    await userManager?.clearStaleState();
  } catch (error) {
    console.warn("Failed to clear stale OIDC state", error);
  }

  if (typeof window === "undefined") return;

  try {
    clearMatchingStorage(window.sessionStorage);
    clearMatchingStorage(window.localStorage);
  } catch (error) {
    console.warn("Failed to clear browser auth state", error);
  }
};

/**
 * Drops the local auth artifacts and restarts the flow from `redirectTo`.
 *
 * Returns `true` when a recovery navigation was started and `false` when the
 * attempt budget is exhausted — in that case the caller must surface the
 * failure to the user instead of retrying.
 */
export const recoverAuthFlow = async ({
  userManager,
  redirectTo = "/",
  maxAttempts = DEFAULT_MAX_AUTH_RECOVERY_ATTEMPTS,
}: {
  userManager?: UserManager | null;
  redirectTo?: string;
  maxAttempts?: number;
}): Promise<boolean> => {
  await clearAuthFlowState(userManager);

  const attempts = getAuthRecoveryAttempts();

  if (attempts >= maxAttempts) {
    console.warn(
      `Auth recovery aborted after ${attempts} attempt(s) to avoid a redirect loop.`,
    );

    return false;
  }

  setAuthRecoveryAttempts(attempts + 1);

  if (typeof window !== "undefined") {
    window.location.replace(redirectTo);
  }

  return true;
};
