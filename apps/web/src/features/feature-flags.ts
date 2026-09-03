import { computed, signal } from "@preact/signals";
import { isAdminUser, userRoles } from "@open-urbis/map-auth";
import {
  evaluateFeatureFlag,
  getEffectiveRule,
  getPostHogFeatureFlag,
  onPostHogFeatureFlags,
  FeatureFlagInput,
  FeatureFlagInputMap,
  FeatureFlagRule,
} from "@open-urbis/map-shared";

export const WEB_FEATURES = [
  "manageLayers",
  "baseMaps",
  "mapFeatures",
  "digitalAddress",
  "goTo",
  "concatenatedSearch",
  "geoJsonSearch",
  "prospectiveSearch",
  "library",
  "threeD",
  "fiu",
] as const;

export type WebFeature = (typeof WEB_FEATURES)[number];

export type { FeatureFlagRule, FeatureFlagInput, FeatureFlagInputMap };
type FeatureFlagMap = Record<WebFeature, FeatureFlagRule>;

const SESSION_FEATURE_FLAGS_KEY = "urbis:web-feature-flags";

const FEATURE_FLAG_ENV_KEYS: Record<WebFeature, string> = {
  manageLayers: "VITE_WEB_FEATURE_MANAGE_LAYERS",
  baseMaps: "VITE_WEB_FEATURE_BASE_MAPS",
  mapFeatures: "VITE_WEB_FEATURE_MAP_FEATURES",
  digitalAddress: "VITE_WEB_FEATURE_DIGITAL_ADDRESS",
  goTo: "VITE_WEB_FEATURE_GO_TO",
  concatenatedSearch: "VITE_WEB_FEATURE_CONCATENATED_SEARCH",
  geoJsonSearch: "VITE_WEB_FEATURE_GEOJSON_SEARCH",
  prospectiveSearch: "VITE_WEB_FEATURE_PROSPECTIVE_SEARCH",
  library: "VITE_WEB_FEATURE_LIBRARY",
  threeD: "VITE_WEB_FEATURE_THREE_D",
  fiu: "VITE_WEB_FEATURE_FIU",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFeature = (value: string): value is WebFeature =>
  WEB_FEATURES.includes(value as WebFeature);

const getStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : undefined;

const parseBooleanEnvValue = (value: unknown) => {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized))
    return false;

  return undefined;
};

const parseFeatureFlags = (value: string | undefined): FeatureFlagInputMap => {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return {};

    return Object.entries(parsed).reduce<FeatureFlagInputMap>(
      (flags, [feature, rule]) => {
        if (!isFeature(feature)) return flags;

        if (typeof rule === "boolean") {
          flags[feature] = rule;
          return flags;
        }

        if (isRecord(rule)) {
          flags[feature] = {
            enabled:
              typeof rule.enabled === "boolean" ? rule.enabled : undefined,
            active: typeof rule.active === "boolean" ? rule.active : undefined,
            roles: getStringArray(rule.roles),
            roleIds: getStringArray(rule.roleIds),
          };
        }

        return flags;
      },
      {},
    );
  } catch (error) {
    console.warn("Invalid web feature flags configuration", error);
    return {};
  }
};

const parseGlobalEnvFeatureFlag = (value: unknown): FeatureFlagInputMap => {
  const enabled = parseBooleanEnvValue(value);
  if (enabled === undefined) return {};

  return WEB_FEATURES.reduce<FeatureFlagInputMap>((flags, feature) => {
    flags[feature] = enabled;
    return flags;
  }, {});
};

const parseIndividualEnvFeatureFlags = (
  env: Record<string, unknown>,
): FeatureFlagInputMap =>
  WEB_FEATURES.reduce<FeatureFlagInputMap>((flags, feature) => {
    const enabled = parseBooleanEnvValue(env[FEATURE_FLAG_ENV_KEYS[feature]]);
    if (enabled !== undefined) flags[feature] = enabled;
    return flags;
  }, {});

const getSessionFeatureFlags = () => {
  if (typeof window === "undefined") return {};

  return parseFeatureFlags(
    window.sessionStorage.getItem(SESSION_FEATURE_FLAGS_KEY) ?? undefined,
  );
};

const envFeatureFlags: FeatureFlagInputMap = {
  ...parseFeatureFlags(import.meta.env.VITE_WEB_FEATURE_FLAGS),
  ...parseGlobalEnvFeatureFlag(import.meta.env.VITE_WEB_FEATURES_ENABLED),
  ...parseIndividualEnvFeatureFlags(import.meta.env),
};

const sessionFeatureFlagOverrides = signal<FeatureFlagInputMap>(
  getSessionFeatureFlags(),
);

const posthogFlagSignal = signal<Record<string, boolean | undefined>>({});

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== SESSION_FEATURE_FLAGS_KEY) return;

    sessionFeatureFlagOverrides.value = parseFeatureFlags(
      event.newValue ?? undefined,
    );
  });

  onPostHogFeatureFlags(() => {
    const updated: Record<string, boolean | undefined> = {};
    for (const feature of WEB_FEATURES) {
      const val = getPostHogFeatureFlag(feature);
      if (typeof val === "boolean") {
        updated[feature] = val;
      }
    }
    posthogFlagSignal.value = updated;
  });
}

export const configuredFeatureFlags = computed<FeatureFlagMap>(() => {
  const sessionFlags = sessionFeatureFlagOverrides.value;
  const posthogFlags = posthogFlagSignal.value;

  return WEB_FEATURES.reduce<FeatureFlagMap>(
    (flags, feature) => {
      flags[feature] = getEffectiveRule(feature, {
        posthogOverride: posthogFlags[feature],
        sessionOverrides: sessionFlags,
        envOverrides: envFeatureFlags,
      });

      return flags;
    },
    {} as FeatureFlagMap,
  );
});

export const enabledFeatureFlags = computed<Record<WebFeature, boolean>>(() => {
  const sessionFlags = sessionFeatureFlagOverrides.value;
  const posthogFlags = posthogFlagSignal.value;
  const isAdmin = isAdminUser.value;
  const userRoleAssignments = userRoles.value;
  const rolesList = userRoleAssignments
    .map((assignment) => assignment.role?.name || assignment.role?.id)
    .filter((r): r is string => Boolean(r));
  const roleIdsList = userRoleAssignments
    .map((assignment) => assignment.role?.id)
    .filter((r): r is string => Boolean(r));

  return WEB_FEATURES.reduce<Record<WebFeature, boolean>>(
    (enabled, feature) => {
      enabled[feature] = evaluateFeatureFlag(feature, {
        isAdmin,
        userRoles: rolesList,
        userRoleIds: roleIdsList,
        posthogOverride: posthogFlags[feature],
        sessionOverrides: sessionFlags,
        envOverrides: envFeatureFlags,
      });
      return enabled;
    },
    {} as Record<WebFeature, boolean>,
  );
});

export const isFeatureEnabled = (feature: WebFeature) =>
  enabledFeatureFlags.value[feature];

export const setSessionFeatureFlags = (flags: FeatureFlagInputMap) => {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    SESSION_FEATURE_FLAGS_KEY,
    JSON.stringify(flags),
  );
  sessionFeatureFlagOverrides.value = flags;
};

export const clearSessionFeatureFlags = () => {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(SESSION_FEATURE_FLAGS_KEY);
  sessionFeatureFlagOverrides.value = {};
};
