import { AuthProvider as MapAuthProvider } from "@open-urbis/map-auth";
import { oidcConfig, userManager } from "./oidc-config";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MapAuthProvider {...oidcConfig} userManager={userManager} apiUrl={apiUrl}>
      {children}
    </MapAuthProvider>
  );
};
