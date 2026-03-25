import { UrbisHeader } from "@open-urbis/map-ui";
import { useAuth } from "react-oidc-context";
import { Debugger } from "../Debugger";
import { MenuToggleButton } from "../MenuToogleButton";
import { ModeToggle } from "../ModeToggle";

interface HeaderProps {
  onMenuToggle?: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const auth = useAuth();

  const menuItems = [
    { label: "Início", href: "/" },
    { label: "Mapa", href: "#" },
    { label: "Viabiliza", href: "#" },
    { label: "Dados Abertos", href: "#" },
    { label: "GitHub", href: "https://github.com/atlas-cli/monorepo" },
    { label: "Documentação", href: "/docs" },
  ];

  return (
    <UrbisHeader
      menuItems={menuItems}
      isAuthenticated={auth.isAuthenticated}
      user={{
        name: auth.user?.profile.name,
        email: auth.user?.profile.email
      }}
      onLogin={() => auth.signinRedirect()}
      onLogout={() => auth.removeUser()}
      leftSlot={<MenuToggleButton onClick={onMenuToggle} />}
      rightSlot={
        <>
          <ModeToggle />
          <div className="hidden lg:block">
            <Debugger />
          </div>
        </>
      }
    />
  );
};

export default Header;
