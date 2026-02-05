import { UrbisHeader, Button, HelpSidebarContent } from "@open-urbis/map-ui";
import { useAuth } from "react-oidc-context";
import { useMemo, useState } from "react";

import { accessControl, userProfile } from "../../auth/user-state";
import { RolePermissionScopeEnum } from "../../utils/access-control";
import { useTheme } from "../ThemeProvider";

// ✅ novo: usar o nav pronto do UI
import { buildUrbisNav } from "@open-urbis/map-ui";

const Header = () => {
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);

  // ✅ badgeText ao lado da logo + menu sem o item da página atual
  const { menuItems, badgeText } = useMemo(() => {
  return buildUrbisNav({
    isAuthenticated: auth.isAuthenticated,
    currentApp: "mapa", // ✅ força “Mapa” como atual
  });
}, [auth.isAuthenticated]);

  const canSeeAdmin = accessControl.value.hasPermission({
    permissions: [
      { resource: "layer-schema", action: "create", scope: RolePermissionScopeEnum.ANY, id: "layer-schema:create" },
      { resource: "layer-schema", action: "update", scope: RolePermissionScopeEnum.ANY, id: "layer-schema:update" },
      { resource: "layer-schema", action: "delete", scope: RolePermissionScopeEnum.ANY, id: "layer-schema:delete" },
    ],
    mode: "OR",
  });

  return (
    <>
      <UrbisHeader
        badgeText={badgeText}
        menuItems={menuItems}
        isAuthenticated={auth.isAuthenticated}
        user={{
          name: userProfile.value?.name ?? auth.user?.profile.name,
          email: userProfile.value?.email ?? auth.user?.profile.email,
        }}
        onLogin={() => auth.signinRedirect()}
        onLogout={() => auth.removeUser()}
        leftSlot={null}
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

            <Button
  variant="outline"                 // 👈 borda
  size="sm"
  onClick={() => setHelpOpen(true)}
  className="hidden md:inline-flex"
  title="Ajuda"
>
  Ajuda
</Button>
          </div>
        }
      />

      {helpOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setHelpOpen(false)}
          />

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
