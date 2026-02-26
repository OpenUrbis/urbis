import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { useAuth } from "@open-urbis/map-auth";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export const AuthRequiredModal = ({
  isOpen,
  onOpenChange,
  title = "Autenticação Necessária",
  description = "Você precisa estar autenticado para acessar esta funcionalidade. Deseja fazer login agora?",
}: AuthRequiredModalProps) => {
  const auth = useAuth();

  const handleLogin = () => {
    auth.signinRedirect();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleLogin}>
            Entrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
