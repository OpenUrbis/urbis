import "preact/debug";

import "@open-urbis/map-ui";
import { Loader2 } from "lucide-react";
import "preact/debug";
import { lazy, ReactNode, Suspense } from "react";
import { Route, Router } from "wouter";
import { MainLayout } from "../../components/MainLayout";

const LayerHandleRoute = lazy(
  () => import("./pages/LayerManager/LayerHandleRoute"),
);
const GroupHandleRoute = lazy(
  () => import("./pages/GroupManager/GroupHandleRoute"),
);
const SearchHandleRoute = lazy(
  () => import("./pages/SearchManager/SearchHandleRoute"),
);
const MapConfigHandleRoute = lazy(
  () => import("./pages/MapConfigManager/MapConfigHandleRoute"),
);
const MapTestRoute = lazy(() => import("./pages/MapTest"));
const MapDataIntegrationTestRoute = lazy(() => import("./pages/MapDataIntegrationTest"));

const AdminPage = () => {
  return (
    <MainLayout>
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
              <Route path="/layer-manager" nest>
                {(<LayerHandleRoute />) as ReactNode}
              </Route>
              <Route path="/group-manager" nest>
                {(<GroupHandleRoute />) as ReactNode}
              </Route>
              <Route path="/search-manager" nest>
                {(<SearchHandleRoute />) as ReactNode}
              </Route>
              <Route path="/map-config-manager" nest>
                {(<MapConfigHandleRoute />) as ReactNode}
              </Route>
              <Route path="/map-test">
                {(<MapTestRoute />) as ReactNode}
              </Route>
              <Route path="/map-data-test">
                {(<MapDataIntegrationTestRoute />) as ReactNode}
              </Route>
            </Suspense>
          ) as ReactNode
        }
      </Router>
    </MainLayout>
  );
};

export default AdminPage;
