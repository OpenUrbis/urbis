import "preact/debug";

import "@open-urbis/map-ui";
import { Loader2 } from "lucide-react";
import "preact/debug";
import { lazy, ReactNode, Suspense } from "react";
import { Route, Router } from "wouter";

const SearchManagerPage = lazy(() => import("./"));
const SearchHandlePage = lazy(() => import("./pages/SearchHandle"));

const SearchHandleRoute = () => {
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
            <Route path="/">{(<SearchManagerPage />) as ReactNode}</Route>
            <Route path="/:id">{(<SearchHandlePage />) as ReactNode}</Route>
          </Suspense>
        ) as ReactNode
      }
    </Router>
  );
};

export default SearchHandleRoute;
