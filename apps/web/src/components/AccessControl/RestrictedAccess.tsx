import { Button } from "@/components/ui/button";
import { LogIn, ShieldAlert } from "lucide-react";

interface RestrictedAccessProps {
  onLogin: () => void;
}

export const RestrictedAccess = ({ onLogin }: RestrictedAccessProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card/80 p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-8 w-8" aria-hidden="true" />
        </div>

        <h1 className="mb-4 text-3xl font-bold tracking-tight">
          Acesso restrito
        </h1>

        <div className="flex justify-center">
          <Button size="lg" onClick={onLogin} className="w-full sm:w-auto">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};
