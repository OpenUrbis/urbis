import { UrbisHeader, Button, HelpSidebarContent } from "@open-urbis/map-ui";
import { useAuth } from "react-oidc-context";
import { useState } from "react";

import { accessControl } from "../../auth/user-state";
import { RolePermissionScopeEnum } from "../../utils/access-control";

import { Debugger } from "../Debugger";
import { MenuToggleButton } from "../MenuToogleButton";
import { useTheme } from "../ThemeProvider";
import { userProfile } from "../../auth/user-state";

const Header = () => {
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);

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

  const canSeeAdmin = accessControl.value.hasPermission({
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
  });

  return (
    <>
      <UrbisHeader
        menuItems={menuItems}
        isAuthenticated={auth.isAuthenticated}
        user={{
          name: userProfile.value?.name ?? auth.user?.profile.name,
          email: userProfile.value?.email ?? auth.user?.profile.email,
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
          <div className="flex items-center gap-2">
            {canSeeAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full hidden lg:flex"
                onClick={() => (window.location.href = "/admin/layer-manager")}
              >
                <span className="material-symbols-outlined text-base">
                  admin_panel_settings
                </span>
                Administração
              </Button>
            )}

            {/* Botão Ajuda */}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-foreground hover:bg-muted transition"
              title="Ajuda"
            >
              <span className="hidden md:inline">Ajuda</span>
            </button>

            <div className="hidden lg:block">
              <Debugger />
            </div>
          </div>
        }
      />

      {/* Sidebar de Ajuda */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setHelpOpen(false)}
          />

          {/* Sidebar */}
          <div className="relative ml-auto h-full w-full max-w-[420px] bg-background shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-sm font-semibold">Ajuda</h2>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
                aria-label="Fechar ajuda"
              >
                ✕
              </button>
            </div>

            <div className="p-3">
              <HelpSidebarContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
