# @open-urbis/map-auth

## 1.1.0

### Minor Changes

- 5100f8a: Fix the OIDC callback redirect loop and centralise the automatic auth transitions.
  - `AuthProvider` now derives the callback route from the configured `redirect_uri`
    instead of hardcoding `/callback`, so auth handling can no longer run on the
    wrong route (or never run) when an app uses a different redirect URI.
  - The silent session restore no longer runs while an authorization response is
    being exchanged. Starting a second navigator during the code exchange aborted
    it, which triggered recovery and restarted the login redirect in a loop.
  - `recoverAuthFlow` is now bounded (`DEFAULT_MAX_AUTH_RECOVERY_ATTEMPTS`) and
    returns whether it actually recovered, so a permanently failing callback
    surfaces an error instead of bouncing the browser forever.
  - `clearAuthFlowState` only clears keys under the `oidc.` prefix. It previously
    matched the substrings `user` and `authority` and could wipe unrelated
    application state.
  - New `RequireAuth` guard and `useAuthCallback` hook so apps stop reimplementing
    (and duplicating) the callback and redirect logic. Both are `StrictMode`-safe:
    every automatic transition is latched with a ref and fires at most once per
    page load.
  - Sign-in now round-trips the originating route through the OIDC `state` and
    returns the user to it (same-origin paths only) instead of always landing on `/`.
  - `createOidcConfig` accepts `scope`, `loadUserInfo`, `automaticSilentRenew` and
    `monitorSession`; these were previously ignored when passed in.

## 1.0.1

### Patch Changes

- Update package licensing metadata to AGPL-3.0-only and prepare a release with the current codebase updates.

## 1.0.0

### Major Changes

- b779bfc: map data integration last version
