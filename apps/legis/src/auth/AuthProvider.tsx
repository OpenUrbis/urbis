import { AuthProvider as MapAuthProvider } from "@open-urbis/map-auth";
import { userManager } from "./oidc-config";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <MapAuthProvider userManager={userManager} apiUrl={apiUrl}>
      {children}
    </MapAuthProvider>
  );
};
