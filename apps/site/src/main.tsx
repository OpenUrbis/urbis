import { setUrbisConfig } from "@open-urbis/map-ui";
import { initPostHog } from "@open-urbis/map-shared";
import { ViteReactSSG } from "vite-react-ssg";
import routes from "./routes";
import "./globals.css";

setUrbisConfig({
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

if (typeof window !== "undefined") {
  initPostHog({ appName: "Urbis Site" });
}

export const createRoot = ViteReactSSG({
  routes,
});
