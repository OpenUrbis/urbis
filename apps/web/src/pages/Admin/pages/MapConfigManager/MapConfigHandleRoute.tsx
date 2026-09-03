import "preact/debug";

import { RequirePermission } from "@/components/AccessControl/RequirePermission";
import { RolePermissionScopeEnum } from "@/utils/access-control";
import "@open-urbis/map-ui";
import { Loader2 } from "lucide-react";
import "preact/debug";
import { lazy, ReactNode, Suspense } from "react";
import { Route, Router } from "wouter";

const MapConfigManagerPage = lazy(() => import("./"));
const MapConfigHandlePage = lazy(() => import("./pages/MapConfigHandle"));

const MapConfigHandleRoute = () => {
  return (
    <Router>
      {
        (
          <Suspense
            fallback={
              <div className="h-screen w-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
              </div>
            }
          >
            <Route path="/">{(<MapConfigManagerPage />) as ReactNode}</Route>
            <Route path="/:id">
              {() => (
                <RequirePermission
                  permissions={{
                    id: "map-config:update",
                    action: "update",
                    resource: "map-config",
                    scope: RolePermissionScopeEnum.ANY,
                  }}
                  redirectTo="~/admin/map-config-manager"
                >
                  <MapConfigHandlePage />
                </RequirePermission>
              )}
            </Route>
          </Suspense>
        ) as ReactNode
      }
    </Router>
  );
};

export default MapConfigHandleRoute;
