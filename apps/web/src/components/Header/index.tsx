import { UrbisHeader } from "@open-urbis/map-ui";
import { useAuth } from "react-oidc-context";
import { Debugger } from "../Debugger";
import { MenuToggleButton } from "../MenuToogleButton";
import { useTheme } from "../ThemeProvider";
import { userProfile } from "../../auth/user-state";

interface HeaderProps {
  onMenuToggle?: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const s3Endpoint =
    import.meta.env.VITE_S3_ENDPOINT_PUBLIC || "http://localhost:9000/public";

  const menuItems = [
    { label: "Mosaico", href: "https://urbis.prefeitura.sp.gov.br" },
    { label: "Mapa", href: "https://mapa.urbis.prefeitura.sp.gov.br", active: true },
    { label: "Dados Abertos", href: "https://dadosabertos.urbis.prefeitura.sp.gov.br" },
    { label: "Legis", href: "https://docs.urbis.prefeitura.sp.gov.br/docs/legis" },
    { label: "Viabiliza", href: "https://viabiliza.urbis.prefeitura.sp.gov.br/docs/legis" },
    { label: "Doc. técnica", href: "https://docs.urbis.prefeitura.sp.gov.br/" },
  ];

  if (auth.isAuthenticated) {
    menuItems.push({
      label: "Datalake",
      href: "https://datalake.urbis.prefeitura.sp.gov.br",
    });
  }

  return (
    <UrbisHeader
      menuItems={menuItems}
      isAuthenticated={auth.isAuthenticated}
      user={{
        name: userProfile.value?.name,
        email: userProfile.value?.email,
        avatarUrl: userProfile.value?.id
          ? `${s3Endpoint}/avatars/${userProfile.value.id}`
          : undefined,
      }}
      onLogin={() => auth.signinRedirect()}
      onLogout={() => auth.removeUser()}
      leftSlot={<MenuToggleButton />}
      theme={theme}
      setTheme={(t) => setTheme(t as "light" | "dark" | "system")}
      rightSlot={
        <div className="hidden lg:block">
          <Debugger />
        </div>
      }
    />
  );
};

export default Header;
