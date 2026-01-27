import { UrbisHeader, Button } from "@open-urbis/map-ui";
import { useAuth } from "react-oidc-context";
import { accessControl } from "../../auth/user-state";
import { RolePermissionScopeEnum } from "../../utils/access-control";
import { Debugger } from "../Debugger";
import { MenuToggleButton } from "../MenuToogleButton";
import { useTheme } from "../ThemeProvider";
import { userProfile } from "../../auth/user-state";

const Header = () => {
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const s3Endpoint =
    import.meta.env.VITE_S3_ENDPOINT_PUBLIC || "http://localhost:9000/public";

  const menuItems = [
    { label: "Mosaico", href: "https://urbis.sampa.br" },
    { label: "Mapa", href: "https://mapa.urbis.sampa.br", active: true },
    { label: "Dados Abertos", href: "https://dadosabertos.urbis.sampa.br" },
    { label: "Legis", href: "https://docs.urbis.sampa.br/docs/legis" },
    { label: "Viabiliza", href: "https://viabiliza.urbis.sampa.br/docs/legis" },
    { label: "Doc. técnica", href: "https://docs.urbis.sampa.br/" },
  ];

  if (auth.isAuthenticated) {
    menuItems.push({
      label: "Datalake",
      href: "https://datalake.urbis.sampa.br",
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
        <div className="hidden lg:flex items-center gap-4">
          {accessControl.value.hasPermission({
            permissions: [
              {
                resource: "layer-schema",
                action: "create",
                scope: RolePermissionScopeEnum.ANY,
                id: "layer-schema:create",
              },
              {
                resource: "layer-schema",
                action: "update",
                scope: RolePermissionScopeEnum.ANY,
                id: "layer-schema:update",
              },
              {
                resource: "layer-schema",
                action: "delete",
                scope: RolePermissionScopeEnum.ANY,
                id: "layer-schema:delete",
              },
            ],
            mode: "OR",
          }) && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-full"
              onClick={() => (window.location.href = "/admin/layer-manager")}
            >
              <span className="material-symbols-outlined text-base">
                admin_panel_settings
              </span>
              Administração
            </Button>
          )}
          <Debugger />
        </div>
      }
    />
  );
};

export default Header;
