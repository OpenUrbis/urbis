import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { RequireAuth as SharedRequireAuth } from "@open-urbis/map-auth";

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  return (
    <SharedRequireAuth
      fallback={
        <div className="h-screen w-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      }
    >
      {children}
    </SharedRequireAuth>
  );
};
