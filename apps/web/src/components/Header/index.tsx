import {
  UrbisHeader,
  Button,
  HelpSidebarContent,
  Switch,
  UrbisIcon,
} from "@open-urbis/map-ui";
import { useAuth } from "@open-urbis/map-auth";
import { useEffect, useMemo, useState } from "react";
import { useNavigationContext } from "../../hooks/useNavigationContext";

import { accessControl, userProfile } from "../../auth/user-state";
import { RolePermissionScopeEnum } from "../../utils/access-control";
import { useTheme } from "../ThemeProvider";

import { buildUrbisNav } from "@open-urbis/map-ui";
import {
  MAP_TUTORIAL_STORAGE_KEY,
  isMobileScreen,
  mapTutorialEnabled,
  mapTutorialInitialDelayDone,
  mapTutorialVisible,
} from "../MapTutorial/state";

const Header = () => {
  const auth = useAuth();
  const { theme, setTheme } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  const [tutorialEnabled, setTutorialEnabled] = useState(!isMobileScreen());
  const { toggleDrawer } = useNavigationContext();

  useEffect(() => {
    if (isMobileScreen()) {
      setTutorialEnabled(false);
      mapTutorialEnabled.value = false;
      mapTutorialVisible.value = false;
      return;
    }

    if (!auth.isAuthenticated) {
      setTutorialEnabled(true);
      mapTutorialEnabled.value = true;
      return;
    }

    const enabled =
      window.localStorage.getItem(MAP_TUTORIAL_STORAGE_KEY) !== "false";
    setTutorialEnabled(enabled);
    mapTutorialEnabled.value = enabled;
  }, [auth.isAuthenticated]);

  const handleTutorialChange = (checked: boolean) => {
    setTutorialEnabled(checked);
    mapTutorialEnabled.value = checked;
    mapTutorialInitialDelayDone.value = true;
    mapTutorialVisible.value = checked;

    if (auth.isAuthenticated) {
      window.localStorage.setItem(MAP_TUTORIAL_STORAGE_KEY, String(checked));
    }
  };

  const { menuItems, badgeText } = useMemo(() => {
    return buildUrbisNav({
      isAuthenticated: auth.isAuthenticated,
      currentApp: "mapa",
    });
  }, [auth.isAuthenticated]);

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
      <div className="urbis-app-header-layer">
        <UrbisHeader
          badgeText={badgeText}
          menuItems={menuItems}
          isAuthenticated={auth.isAuthenticated}
          user={{
            name: userProfile.value?.name ?? auth.user?.profile.name,
            socialName:
              userProfile.value?.socialName ??
              (auth.user?.profile.socialName as string),
            email: userProfile.value?.email ?? auth.user?.profile.email,
          }}
          onLogin={() => auth.signinRedirect()}
          onLogout={() => auth.signoutRedirect()}
          theme={theme}
          setTheme={(t) => setTheme(t as "light" | "dark" | "system")}
          extraSettingsContent={
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  Modo tutorial
                </p>
                <Switch
                  checked={tutorialEnabled}
                  onCheckedChange={handleTutorialChange}
                  aria-label="Ativar modo tutorial"
                />
              </div>
            </div>
          }
          leftSlot={
            <Button
              variant="outline"
              size="icon"
              className="md:hidden rounded-full h-9 w-9 mr-2 shrink-0"
              onClick={toggleDrawer}
            >
              <UrbisIcon
                name="search"
                className="text-base"
                aria-hidden="true"
              />
            </Button>
          }
          rightSlot={
            <div className="flex items-center gap-2">
              {canSeeAdmin && (
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full hidden lg:flex h-9 w-9"
                  onClick={() =>
                    (window.location.href = "/admin/layer-manager")
                  }
                  title="Administração"
                >
                  <UrbisIcon
                    name="admin_panel_settings"
                    className="text-base"
                    aria-hidden="true"
                  />
                </Button>
              )}

              {/* Ajuda desktop */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHelpOpen(true)}
                className="hidden md:inline-flex h-9 rounded-full px-4"
                title="Ajuda"
                aria-label="Ajuda"
              >
                Ajuda
              </Button>

              {/* Ajuda mobile */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setHelpOpen(true)}
                className="inline-flex md:hidden h-9 w-9 rounded-full"
                title="Ajuda"
                aria-label="Ajuda"
              >
                ?
              </Button>
            </div>
          }
        />
      </div>

      {helpOpen && (
        <div className="urbis-app-modal-layer fixed inset-0 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setHelpOpen(false)}
          />

          {/* Drawer */}
          <div className="relative ml-auto flex h-full w-full max-w-[420px] flex-col bg-background shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b shrink-0">
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

            {/* Conteúdo */}
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <HelpSidebarContent
                currentTabSlug="mapa"
                appFilter="mapa"
                faqEndpointBase={
                  import.meta.env.VITE_API_URL + "/support/question-tabs"
                }
                endpoint={
                  import.meta.env.VITE_API_URL + "/support/create-ticket"
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
