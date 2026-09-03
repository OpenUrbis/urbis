import { signal } from "@preact/signals";

export const MAP_TUTORIAL_STORAGE_KEY = "urbis:map-tutorial-enabled";

export const isMobileScreen = () =>
  typeof window !== "undefined"
    ? window.innerWidth < 768 ||
      (window.matchMedia?.("(max-width: 767px)")?.matches ?? false)
    : false;

export const mapTutorialEnabled = signal(!isMobileScreen());
export const mapTutorialVisible = signal(false);
export const mapTutorialInitialDelayDone = signal(false);
