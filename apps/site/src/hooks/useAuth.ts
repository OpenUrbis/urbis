import { useAuth as useOidcAuth } from "@open-urbis/map-auth";

export const useAuth = () => {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      signinRedirect: () => Promise.resolve(),
      signoutRedirect: () => Promise.resolve(),
      user: null,
      isLoading: false,
      activeNavigator: undefined,
      error: undefined,
      events: {},
      signinSilent: () => Promise.resolve(null),
      signinPopup: () => Promise.resolve(null),
      signoutPopup: () => Promise.resolve(),
      querySessionStatus: () => Promise.resolve(null),
      revokeTokens: () => Promise.resolve(),
      startSilentRenew: () => {},
      stopSilentRenew: () => {},
      settings: {},
    } as any;
  }
  
  // Naive check: if we are in browser but AuthProvider is missing (e.g. during some hydration edge cases or tests),
  // useOidcAuth might throw. But in our GlobalProvider logic, if window exists, AuthProvider should exist.
  // However, safe to wrap in try/catch? No, hooks can't be in try/catch.
  // We trust GlobalProvider logic: window !== undefined => userManager !== null => AuthProvider rendered.
  
  return useOidcAuth();
};
