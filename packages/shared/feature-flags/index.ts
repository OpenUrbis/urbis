/**
 * Unified Feature Flags - Single Source of Truth
 */

export interface FeatureFlagRule {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: "map" | "legis" | "accounts" | "docs" | "common";
  roles?: string[];
  roleIds?: string[];
}

export type FeatureFlagInput =
  | boolean
  | {
      enabled?: boolean;
      active?: boolean;
      roles?: string[];
      roleIds?: string[];
    };

export type FeatureFlagInputMap = Partial<Record<string, FeatureFlagInput>>;

/**
 * Code Single Source of Truth for all feature flags across Urbis applications.
 */
export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlagRule> = {
  // Map features
  manageLayers: {
    key: "manageLayers",
    name: "Gerenciador de Camadas",
    description: "Permite adicionar, editar e remover camadas no mapa.",
    enabled: true,
    category: "map",
    roles: [],
  },
  baseMaps: {
    key: "baseMaps",
    name: "Seleção de Mapas Base",
    description: "Permite alternar entre estilos e provedores de mapa base.",
    enabled: true,
    category: "map",
    roles: [],
  },
  mapFeatures: {
    key: "mapFeatures",
    name: "Funcionalidades Avançadas do Mapa",
    description: "Habilita ferramentas avançadas de interação com vetores e feições.",
    enabled: true,
    category: "map",
    roles: [],
  },
  digitalAddress: {
    key: "digitalAddress",
    name: "Endereço Digital (Plus Code)",
    description: "Habilita busca e geração de Endereço Digital.",
    enabled: true,
    category: "map",
    roles: [],
  },
  goTo: {
    key: "goTo",
    name: "Navegação por Coordenadas",
    description: "Permite saltar para coordenadas geográficas específicas.",
    enabled: true,
    category: "map",
    roles: [],
  },
  concatenatedSearch: {
    key: "concatenatedSearch",
    name: "Busca Concatenada",
    description: "Busca combinada de termos em múltiplas camadas do mapa.",
    enabled: true,
    category: "map",
    roles: [],
  },
  geoJsonSearch: {
    key: "geoJsonSearch",
    name: "Busca e Upload de GeoJSON",
    description: "Permite importar e pesquisar arquivos GeoJSON customizados.",
    enabled: true,
    category: "map",
    roles: [],
  },
  prospectiveSearch: {
    key: "prospectiveSearch",
    name: "Busca Prospectiva Urbanística",
    description: "Ferramenta de análise e consulta prospectiva para viabilidade de lotes.",
    enabled: true,
    category: "map",
    roles: [],
  },
  library: {
    key: "library",
    name: "Biblioteca de Legislação no Mapa",
    description: "Exibe acervo legislativo vinculado a feições geográficas.",
    enabled: true,
    category: "map",
    roles: [],
  },
  threeD: {
    key: "threeD",
    name: "Visualização 3D",
    description: "Habilita camada e renderização tridimensional de edificações.",
    enabled: true,
    category: "map",
    roles: [],
  },
  fiu: {
    key: "fiu",
    name: "Ficha de Informação Urbanística (FIU)",
    description: "Geração de relatório/ficha urbanística detalhada para o lote.",
    enabled: true,
    category: "map",
    roles: [],
  },

  // Legis features
  legisEditor: {
    key: "legisEditor",
    name: "Editor Avançado do Legis",
    description: "Edição estruturada e geração de minutas normativas.",
    enabled: true,
    category: "legis",
    roles: [],
  },
  legisDiffViewer: {
    key: "legisDiffViewer",
    name: "Visualizador de Alterações de Lei",
    description: "Comparativo em tempo real de versões de textos legais.",
    enabled: true,
    category: "legis",
    roles: [],
  },

  // Accounts features
  accountsApiKeys: {
    key: "accountsApiKeys",
    name: "Gestão de Chaves de API (WFS)",
    description: "Permite emitir e gerenciar chaves de acesso a dados WFS/SIG.",
    enabled: true,
    category: "accounts",
    roles: [],
  },

  // Docs features
  docsSearch: {
    key: "docsSearch",
    name: "Busca Interativa de Documentação",
    description: "Busca rápida e filtro de documentos no portal de docs.",
    enabled: true,
    category: "docs",
    roles: [],
  },

  // Telemetry & Analytics
  analyticsTracking: {
    key: "analyticsTracking",
    name: "Telemetria e Analytics (PostHog)",
    description: "Habilita envio de eventos e rastreamento de uso para o PostHog.",
    enabled: true,
    category: "common",
    roles: [],
  },
};

export interface EvaluateFlagOptions {
  userRoles?: string[];
  userRoleIds?: string[];
  isAdmin?: boolean;
  posthogOverride?: boolean;
  envOverrides?: FeatureFlagInputMap;
  sessionOverrides?: FeatureFlagInputMap;
}

export function normalizeRule(
  current: FeatureFlagRule,
  override: FeatureFlagInput | undefined
): FeatureFlagRule {
  if (override === undefined) return current;

  if (typeof override === "boolean") {
    return { ...current, enabled: override };
  }

  return {
    ...current,
    enabled: override.enabled ?? override.active ?? current.enabled,
    roles: override.roles ?? current.roles,
    roleIds: override.roleIds ?? current.roleIds,
  };
}

export function getEffectiveRule(
  key: string,
  options: EvaluateFlagOptions = {}
): FeatureFlagRule {
  const baseRule = DEFAULT_FEATURE_FLAGS[key] || {
    key,
    name: key,
    description: "",
    enabled: true,
    category: "common",
  };

  let rule = normalizeRule(baseRule, options.envOverrides?.[key]);
  rule = normalizeRule(rule, options.sessionOverrides?.[key]);

  if (typeof options.posthogOverride === "boolean") {
    rule = { ...rule, enabled: options.posthogOverride };
  }

  return rule;
}

/**
 * Checks if user matches the required roles for a feature flag.
 */
export function isUserAuthorizedForFlag(
  rule: FeatureFlagRule,
  options: { userRoles?: string[]; userRoleIds?: string[]; isAdmin?: boolean } = {}
): boolean {
  const { userRoles = [], userRoleIds = [], isAdmin = false } = options;
  const hasRoleRestriction =
    (rule.roles?.length ?? 0) > 0 || (rule.roleIds?.length ?? 0) > 0;

  if (!hasRoleRestriction) {
    return true;
  }

  if (isAdmin) {
    return true;
  }

  if (rule.roles && rule.roles.some((r) => userRoles.includes(r))) {
    return true;
  }

  if (rule.roleIds && rule.roleIds.some((id) => userRoleIds.includes(id))) {
    return true;
  }

  return false;
}

/**
 * Evaluates a feature flag considering overrides in hierarchy:
 * 1. PostHog override (if provided)
 * 2. Session override (if provided)
 * 3. Env override (if provided)
 * 4. Code rule default
 * Followed by RBAC check.
 */
export function evaluateFeatureFlag(
  key: string,
  options: EvaluateFlagOptions = {}
): boolean {
  const rule = getEffectiveRule(key, options);

  if (!rule.enabled) {
    return false;
  }

  // Role-based access evaluation
  return isUserAuthorizedForFlag(rule, {
    userRoles: options.userRoles,
    userRoleIds: options.userRoleIds,
    isAdmin: options.isAdmin,
  });
}

/**
 * Evaluates all feature flags and returns a map of boolean states.
 */
export function evaluateAllFeatureFlags(
  options: EvaluateFlagOptions = {}
): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const key of Object.keys(DEFAULT_FEATURE_FLAGS)) {
    result[key] = evaluateFeatureFlag(key, options);
  }

  return result;
}
