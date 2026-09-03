import { RequirePermission } from "@/components/AccessControl/RequirePermission";
import { RolePermissionScopeEnum } from "@/utils/access-control";
import "@open-urbis/map-ui";
import { Loader2 } from "lucide-react";
import "preact/debug";
import { lazy, ReactNode, Suspense } from "react";
import { Route, Router } from "wouter";

const GroupManagerPage = lazy(() => import("./"));
const GroupHandlePage = lazy(() => import("./pages/GroupHandle"));

const GroupHandleRoute = () => {
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
            <Route path="/">{(<GroupManagerPage />) as ReactNode}</Route>
            <Route path="/:id">
              {(params) => {
                const isCreate = params.id === "handle";
                const action = isCreate ? "create" : "update";

                return (
                  <RequirePermission
                    permissions={{
                      id: `layer-group:${action}`,
                      action,
                      resource: "layer-group",
                      scope: RolePermissionScopeEnum.ANY,
                    }}
                    redirectTo="~/admin/group-manager"
                  >
                    <GroupHandlePage />
                  </RequirePermission>
                );
              }}
            </Route>
          </Suspense>
        ) as ReactNode
      }
    </Router>
  );
};

export default GroupHandleRoute;
