import { AccessControl } from '../common/guards/access-control/access-control';
import { RolePermissionScopeEnum } from '../role/enums/role-permission-scope.enum';
import { RepresentationController } from './representation.controller';

describe('RepresentationController authorization scope', () => {
  let service: any;
  let controller: RepresentationController;

  beforeEach(() => {
    service = {
      requestRepresentation: jest.fn(),
      checkOrganizationDocument: jest.fn(),
      findOne: jest.fn(),
      getOverview: jest.fn(),
      findAll: jest.fn(),
      updateStatus: jest.fn(),
      approve: jest.fn(),
      reject: jest.fn(),
      requestInfo: jest.fn(),
      addComment: jest.fn(),
    };
    controller = new RepresentationController(service);
  });

  function accessControlWithPermissions(
    permissions: Array<{
      action: string;
      scope: RolePermissionScopeEnum;
    }>,
  ) {
    return new AccessControl([
      {
        organization: { id: 'organization-a' },
        role: {
          rolePermissions: permissions.map((permission) => ({
            permission: {
              id: `representation:${permission.action}`,
              resource: 'representation',
              action: permission.action,
            },
            scope: permission.scope,
          })),
        },
      },
    ] as any);
  }

  function supportAccessControlWithPermissions(
    permissions: Array<{
      action: string;
      scope: RolePermissionScopeEnum;
    }>,
  ) {
    const accessControl = accessControlWithPermissions(permissions);
    (accessControl as any)._roles.add({
      id: 'f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4',
    });
    return accessControl;
  }

  it('only returns organizations with an explicit ANY permission for the action', () => {
    // The organizationId belongs to the role assignment, so model each
    // permission as a separate assignment to preserve its scope.
    const scopedAccessControl = new AccessControl([
      {
        organization: { id: 'organization-a' },
        role: {
          rolePermissions: [
            {
              permission: {
                id: 'representation:list',
                resource: 'representation',
                action: 'list',
              },
              scope: RolePermissionScopeEnum.ANY,
            },
          ],
        },
      },
      {
        organization: { id: 'organization-b' },
        role: {
          rolePermissions: [
            {
              permission: {
                id: 'representation:list',
                resource: 'representation',
                action: 'list',
              },
              scope: RolePermissionScopeEnum.OWN,
            },
          ],
        },
      },
    ] as any);

    expect(
      (controller as any).getAuthorizedOrganizationIds(
        scopedAccessControl,
        'list',
      ),
    ).toEqual(['organization-a']);
  });

  it('does not treat an ANY permission as GLOBAL', () => {
    const accessControl = accessControlWithPermissions([
      {
        action: 'list',
        scope: RolePermissionScopeEnum.ANY,
      },
    ]);

    expect((controller as any).hasGlobalPermission(accessControl, 'list')).toBe(
      false,
    );
  });

  it('forwards an OWN user reading their own request without organizational access', async () => {
    const user = { id: 'requester-1' } as any;
    const accessControl = accessControlWithPermissions([
      { action: 'view', scope: RolePermissionScopeEnum.OWN },
    ]);

    await controller.findOne('representation-1', user, accessControl);

    expect(service.findOne).toHaveBeenCalledWith(
      'representation-1',
      user,
      [],
      false,
    );
  });

  it('forwards an entity-authorized user with only the explicitly permitted organization', async () => {
    const user = { id: 'organization-user' } as any;
    const accessControl = accessControlWithPermissions([
      { action: 'view', scope: RolePermissionScopeEnum.ANY },
    ]);

    await controller.findOne('representation-1', user, accessControl);

    expect(service.findOne).toHaveBeenCalledWith(
      'representation-1',
      user,
      ['organization-a'],
      false,
    );
  });

  it('forwards a global administrator without incorrectly narrowing its read scope', async () => {
    const user = { id: 'administrator-1' } as any;
    const accessControl = accessControlWithPermissions([
      { action: 'view', scope: RolePermissionScopeEnum.GLOBAL },
    ]);

    await controller.findOne('representation-1', user, accessControl);

    expect(service.findOne).toHaveBeenCalledWith(
      'representation-1',
      user,
      [],
      true,
    );
  });

  it('limits overview access to the selected organization only when it has an ANY list permission', async () => {
    const user = { id: 'organization-user' } as any;
    const query = { page: 1, limit: 10 } as any;
    const accessControl = accessControlWithPermissions([
      { action: 'list', scope: RolePermissionScopeEnum.ANY },
    ]);

    await controller.getOverview(
      query,
      user,
      { id: 'organization-a' } as any,
      accessControl,
    );

    expect(service.getOverview).toHaveBeenCalledWith(
      user,
      query,
      ['organization-a'],
      false,
    );
  });

  it('does not turn an unpermitted organization header into organization-wide overview access', async () => {
    const user = { id: 'organization-user' } as any;
    const query = { page: 1, limit: 10 } as any;
    const accessControl = accessControlWithPermissions([
      { action: 'list', scope: RolePermissionScopeEnum.ANY },
    ]);

    await controller.getOverview(
      query,
      user,
      { id: 'organization-b' } as any,
      accessControl,
    );

    expect(service.getOverview).toHaveBeenCalledWith(user, query, [], false);
  });

  it('forwards a global administrator overview without organization restrictions', async () => {
    const user = { id: 'administrator-1' } as any;
    const query = { page: 1, limit: 10 } as any;
    const accessControl = accessControlWithPermissions([
      { action: 'list', scope: RolePermissionScopeEnum.GLOBAL },
    ]);

    await controller.getOverview(
      query,
      user,
      { id: 'organization-b' } as any,
      accessControl,
    );

    expect(service.getOverview).toHaveBeenCalledWith(user, query, [], true);
  });

  it('passes the manually filled request payload without attempting a CPF lookup', async () => {
    const user = { id: 'requester-1' } as any;
    const dto = {
      document: '52998224725',
      representationType: 'attorney',
      name: 'Pessoa informada',
      documents: [{ category: 'power_of_attorney', files: ['mandate.pdf'] }],
    } as any;

    await controller.requestRepresentation({ user }, dto);

    expect(service.requestRepresentation).toHaveBeenCalledWith(user, dto);
    expect(service.checkOrganizationDocument).not.toHaveBeenCalled();
  });

  it('forwards the CNPJ lookup and selected representation type', async () => {
    const user = { id: 'requester-1' } as any;

    await controller.checkDocument('46.395.000/0001-39', 'representative', {
      user,
    });

    expect(service.checkOrganizationDocument).toHaveBeenCalledWith(
      '46.395.000/0001-39',
      user,
      'representative',
    );
  });

  it('forwards the general list with explicit organization scope', async () => {
    const user = { id: 'organization-user' } as any;
    const accessControl = accessControlWithPermissions([
      { action: 'list', scope: RolePermissionScopeEnum.ANY },
    ]);

    await controller.findAll(2, 25, user, accessControl);

    expect(service.findAll).toHaveBeenCalledWith(
      user,
      { page: 2, limit: 25 },
      ['organization-a'],
      false,
    );
  });

  it('keeps a global list unscoped for the global administrator', async () => {
    const user = { id: 'administrator-1' } as any;
    const accessControl = accessControlWithPermissions([
      { action: 'list', scope: RolePermissionScopeEnum.GLOBAL },
    ]);

    await controller.findAll(1, 10, user, accessControl);

    expect(service.findAll).toHaveBeenCalledWith(
      user,
      { page: 1, limit: 10 },
      [],
      true,
    );
  });

  it('passes status edits only with the organizations authorized for approval', async () => {
    const user = { id: 'organization-user' } as any;
    const dto = {
      status: 'APPROVED',
      text: 'Documentos conferidos.',
      attachments: ['parecer.pdf'],
    } as any;
    const accessControl = supportAccessControlWithPermissions([
      { action: 'approve', scope: RolePermissionScopeEnum.ANY },
    ]);

    await controller.updateStatus('representation-1', dto, user, accessControl);

    expect(service.updateStatus).toHaveBeenCalledWith(
      'representation-1',
      user,
      'APPROVED',
      'Documentos conferidos.',
      ['parecer.pdf'],
      ['organization-a'],
      false,
    );
  });

  it.each([
    ['approve', 'approve', RolePermissionScopeEnum.GLOBAL],
    ['reject', 'reject', RolePermissionScopeEnum.ANY],
  ])(
    'forwards the %s action using its own permission scope',
    async (_label, method, scope) => {
      const user = { id: 'reviewer' } as any;
      const accessControl = supportAccessControlWithPermissions([
        { action: method, scope },
      ]);

      await (controller as any)[method](
        'representation-1',
        user,
        accessControl,
      );

      expect(service[method]).toHaveBeenCalledWith(
        'representation-1',
        user,
        scope === RolePermissionScopeEnum.GLOBAL ? [] : ['organization-a'],
        scope === RolePermissionScopeEnum.GLOBAL,
      );
    },
  );

  it('rejects organization administrators even when legacy decision permissions remain', async () => {
    const accessControl = accessControlWithPermissions([
      { action: 'approve', scope: RolePermissionScopeEnum.ANY },
      { action: 'reject', scope: RolePermissionScopeEnum.ANY },
    ]);

    await expect(
      controller.approve(
        'representation-1',
        { id: 'org-admin' } as any,
        accessControl,
      ),
    ).rejects.toThrow('Only support administrators');
    await expect(
      controller.reject(
        'representation-1',
        { id: 'org-admin' } as any,
        accessControl,
      ),
    ).rejects.toThrow('Only support administrators');
    expect(service.approve).not.toHaveBeenCalled();
    expect(service.reject).not.toHaveBeenCalled();
  });

  it('keeps comments and information requests informational without adding co-representative workflow', async () => {
    const user = { id: 'reviewer' } as any;
    const dto = {
      text: 'Envie o documento completo.',
      attachments: ['note.pdf'],
    };
    const accessControl = accessControlWithPermissions([
      { action: 'comment', scope: RolePermissionScopeEnum.ANY },
    ]);

    await controller.requestInfo(
      'representation-1',
      dto as any,
      user,
      accessControl,
    );
    await controller.addComment(
      'representation-1',
      user,
      dto as any,
      accessControl,
    );

    expect(service.requestInfo).toHaveBeenCalledWith(
      'representation-1',
      user,
      dto.text,
      dto.attachments,
      ['organization-a'],
      false,
    );
    expect(service.addComment).toHaveBeenCalledWith(
      'representation-1',
      user,
      dto.text,
      dto.attachments,
      ['organization-a'],
      false,
    );
  });
});
