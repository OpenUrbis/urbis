import posthog from "posthog-js";

export interface PostHogConfig {
  apiKey?: string;
  apiHost?: string;
  appName?: string;
  debug?: boolean;
  autocapture?: boolean;
  defaults?: string;
  userProperties?: Record<string, any>;
}

let isInitialized = false;

function getEnvVariable(key: string): string | undefined {
  if (typeof window !== "undefined" && (window as any).env?.[key]) {
    return (window as any).env[key];
  }
  const globalObj = typeof globalThis !== "undefined" ? (globalThis as any) : {};
  if (globalObj.process?.env?.[key]) {
    return globalObj.process.env[key];
  }
  return undefined;
}

/**
 * Safely initializes PostHog analytics on client apps.
 * If apiKey is missing or invalid, PostHog operates as a safe no-op.
 */
export function initPostHog(config: PostHogConfig = {}) {
  if (typeof window === "undefined" || isInitialized) {
    return posthog;
  }

  const apiKey =
    config.apiKey ||
    getEnvVariable("NEXT_PUBLIC_POSTHOG_KEY") ||
    getEnvVariable("VITE_POSTHOG_KEY") ||
    getEnvVariable("POSTHOG_KEY");

  const apiHost =
    config.apiHost ||
    getEnvVariable("NEXT_PUBLIC_POSTHOG_HOST") ||
    getEnvVariable("VITE_POSTHOG_HOST") ||
    getEnvVariable("POSTHOG_HOST") ||
    "https://eu.i.posthog.com";

  if (!apiKey) {
    if (config.debug) {
      console.log("[PostHog] No API key provided. Analytics disabled.");
    }
    return posthog;
  }

  try {
    posthog.init(apiKey, {
      api_host: apiHost,
      defaults: (config.defaults ?? "2026-05-30") as any,
      autocapture: config.autocapture ?? true,
      capture_pageview: true,
      capture_pageleave: true,
      loaded: (ph) => {
        if (config.appName) {
          ph.register({ app_name: config.appName });
        }
        if (config.debug) {
          console.log(`[PostHog] Initialized successfully for ${config.appName || "Urbis Client"}`);
        }
      },
    });
    isInitialized = true;
  } catch (err) {
    console.warn("[PostHog] Failed to initialize:", err);
  }

  return posthog;
}

/**
 * Tracks a custom analytics event in PostHog.
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(eventName, properties);
  } catch (err) {
    console.warn("[PostHog] Failed to capture event:", err);
  }
}

/**
 * Identifies the logged-in user in PostHog.
 */
export function identifyUser(userId: string, userProperties?: Record<string, any>) {
  if (typeof window === "undefined" || !userId) return;
  try {
    posthog.identify(userId, userProperties);
  } catch (err) {
    console.warn("[PostHog] Failed to identify user:", err);
  }
}

/**
 * Resets the PostHog session on logout.
 */
export function resetUser() {
  if (typeof window === "undefined") return;
  try {
    posthog.reset();
  } catch (err) {
    console.warn("[PostHog] Failed to reset user:", err);
  }
}

/**
 * Returns a feature flag state from PostHog ONLY if the flag is explicitly configured on PostHog.
 */
export function getPostHogFeatureFlag(flagKey: string): boolean | string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeFlags: string[] = (posthog as any).featureFlags?.getFlags?.() || [];
    if (!activeFlags.includes(flagKey)) {
      return undefined;
    }
    const val = posthog.getFeatureFlag(flagKey);
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val;
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Listens for PostHog feature flag updates.
 */
export function onPostHogFeatureFlags(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  try {
    return posthog.onFeatureFlags(callback);
  } catch {
    return () => {};
  }
}

export { posthog };
