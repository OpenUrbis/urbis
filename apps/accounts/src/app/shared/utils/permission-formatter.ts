export interface ISimplePermission {
  id: string;
  action: string;
  name: string;
  description: string;
  resource: string;
}

const RESOURCE_LABELS: Record<string, string> = {
  role: 'Cargos',
  user: 'Usuários',
  auth: 'Segurança',
  organization: 'Entidades',
  permission: 'Permissões',
  'question-tab': 'Guias de Ajuda',
  'question-answer': 'Perguntas de Ajuda',
  'layer-schema': 'Esquemas de Mapa',
  'layer-group': 'Grupos de Mapa',
  'search-config': 'Configurações de Busca',
  'app-settings': 'Configurações do Sistema',
  representation: 'Representações',
  'map-config': 'Configurações do Mapa',
};

const ACTION_LABELS: Record<string, string> = {
  list: 'Visualizar',
  view: 'Visualizar',
  create: 'Criar',
  update: 'Editar',
  delete: 'Excluir',
  assign: 'Atribuir',
  unassign: 'Remover',
  'reset-2fa': 'Resetar 2FA',
  'reset-password': 'Resetar Senha',
  approve: 'Aprovar',
  reject: 'Rejeitar',
  comment: 'Comentar',
};

const FRIENDLY_PERMISSIONS: Record<
  string,
  { name: string; description: string }
> = {
  'role:list': {
    name: 'Visualizar cargos',
    description: 'Ver a lista de cargos e suas permissões',
  },
  'role:create': {
    name: 'Criar cargos',
    description: 'Criar novos cargos no sistema',
  },
  'role:update': {
    name: 'Editar cargos',
    description: 'Alterar detalhes e permissões de cargos existentes',
  },
  'role:assign': {
    name: 'Atribuir cargos',
    description: 'Atribuir e vincular cargos a usuários',
  },
  'role:unassign': {
    name: 'Remover cargos',
    description: 'Retirar cargos de usuários',
  },
  'user:create': {
    name: 'Criar usuários',
    description: 'Cadastrar novos usuários no sistema',
  },
  'user:update': {
    name: 'Editar usuários',
    description: 'Alterar dados e informações de usuários existentes',
  },
  'user:delete': {
    name: 'Excluir usuários',
    description: 'Remover permanentemente usuários do sistema',
  },
  'auth:reset-2fa': {
    name: 'Resetar 2FA',
    description: 'Resetar a autenticação de dois fatores de usuários',
  },
  'auth:reset-password': {
    name: 'Resetar senha',
    description: 'Resetar a senha de acesso de usuários',
  },
  'organization:create': {
    name: 'Criar entidades',
    description: 'Cadastrar novas entidades no sistema',
  },
  'organization:update': {
    name: 'Editar entidades',
    description: 'Alterar dados de entidades existentes',
  },
};

export function getFriendlyPermission<
  T extends {
    id: string;
    action?: string;
    resource?: string;
    name: string;
    description: string;
  },
>(prm: T): T {
  if (!prm) return prm;
  const key =
    prm.id ||
    (prm.resource && prm.action ? `${prm.resource}:${prm.action}` : '');
  const friendly = FRIENDLY_PERMISSIONS[key];
  if (friendly) {
    return {
      ...prm,
      name: friendly.name,
      description: friendly.description,
    };
  }
  return prm;
}

export function formatRolePermissions(
  rolePermissions: {
    permission:
      | { id: string; action: string; resource: string; name: string }
      | any;
  }[],
): string {
  if (!rolePermissions || rolePermissions.length === 0) {
    return 'Sem permissões';
  }

  // Group by resource
  const grouped: Record<string, string[]> = {};

  rolePermissions.forEach(({ permission }) => {
    if (!permission) return;
    const resource =
      permission.resource || permission.id?.split(':')[0] || 'Outros';
    const action = permission.action || permission.id?.split(':')[1] || '';

    const resourceLabel = RESOURCE_LABELS[resource] || resource;
    const actionLabel = ACTION_LABELS[action] || action || permission.name;

    if (!grouped[resourceLabel]) {
      grouped[resourceLabel] = [];
    }
    if (!grouped[resourceLabel].includes(actionLabel)) {
      grouped[resourceLabel].push(actionLabel);
    }
  });

  return Object.entries(grouped)
    .map(([resource, actions]) => `${resource} (${actions.join(', ')})`)
    .join(' | ');
}
