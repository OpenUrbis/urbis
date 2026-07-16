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
  
  return useOidcAuth();
};
