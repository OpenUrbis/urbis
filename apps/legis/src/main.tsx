import React from "react";
import ReactDOM from "react-dom/client";
import { initPostHog } from "@open-urbis/map-shared";
import { App } from "./App";
import "./globals.css";

initPostHog({ appName: "Urbis Legis" });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
