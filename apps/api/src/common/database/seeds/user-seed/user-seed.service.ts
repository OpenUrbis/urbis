import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Organization } from '../../../../organization/entities/organization.entity';
import { Permission } from '../../../../role/entities/permission.entity';
import { RolePermission } from '../../../../role/entities/role-permission.entity';
import { Role } from '../../../../role/entities/role.entity';
import { UserRoleAssignment } from '../../../../role/entities/user-role-assignment.entity';
import { RolePermissionScopeEnum } from '../../../../role/enums/role-permission-scope.enum';
import { RoleTypeEnum } from '../../../../role/enums/role-type.enum';
import { User } from '../../../../user/entities/user.entity';
import { UserStatus } from '../../../../user/enums/user-status.enum';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepository: Repository<UserRoleAssignment>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,

    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async createOrg() {
    const existingOrg = await this.organizationRepository.findOne({
      where: { name: 'Codata' },
    });

    if (existingOrg) {
      return existingOrg;
    }

    const org = this.organizationRepository.create({
      name: 'Codata',
      metadata: {
        tenantType: 'mono',
        organizationType: 'Secretaria',
        organizationTypes: ['Secretaria', 'Empresa', 'Autarquia'],
      },
    });

    return await this.organizationRepository.save(org);
  }

  async createUser() {
    let user = await this.userRepository.findOne({
      where: { email: 'test@test.com' },
    });

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash('Teste@1234', salt);

    if (user) {
      user.password = password;
      return await this.userRepository.save(user);
    }

    user = this.userRepository.create({
      email: 'test@test.com',
      password,
      firstName: 'John',
      lastName: 'Dom',
      status: UserStatus.ACTIVE,
    });

    return await this.userRepository.save(user);
  }

  async createUserAssignment() {
    const org = await this.createOrg();
    const user = await this.createUser();

    const existingAssign = await this.userRoleAssignmentRepository.findOne({
      where: {
        organizationId: org.id,
        userId: user.id,
        roleId: 'f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4',
      },
    });

    if (existingAssign) {
      return existingAssign;
    }

    const assign = this.userRoleAssignmentRepository.create({
      organizationId: org.id,
      userId: user.id,
      roleId: 'f5fe5a01-b8e8-4f45-8701-45a6b24ba2d4',
    });

    return await this.userRoleAssignmentRepository.save(assign);
  }

  async createTestScenarios() {
    // 1. Create Permissions
    const resources = ['organization', 'user'];
    const actions = ['list', 'view', 'update', 'create', 'delete'];

    // Ensure basic permissions exist
    const permissions: Permission[] = [];
    for (const res of resources) {
      for (const act of actions) {
        let p = await this.permissionRepository.findOne({
          where: { resource: res, action: act },
        });
        if (!p) {
          p = await this.permissionRepository.save(
            this.permissionRepository.create({
              name: `${res}:${act}`,
              resource: res,
              action: act,
              description: `${act} ${res}`,
            }),
          );
        }
        permissions.push(p);
      }
    }

    // 2. Create Roles with Scopes
    const createRole = async (name: string, scope: RolePermissionScopeEnum) => {
      let role = await this.roleRepository.findOne({ where: { name } });
      if (!role) {
        role = await this.roleRepository.save(
          this.roleRepository.create({
            name,
            description: `Test Role ${scope}`,
            type: RoleTypeEnum.USER,
            isDefault: false,
          }),
        );
      }

      // Assign permissions
      for (const p of permissions) {
        const existingPermission = await this.rolePermissionRepository.findOne({
          where: {
            role: { id: role.id },
            permission: { id: p.id },
          },
        });

        if (!existingPermission) {
          await this.rolePermissionRepository.save(
            this.rolePermissionRepository.create({
              role,
              permission: p,
              scope: scope,
            }),
          );
        } else if (existingPermission.scope !== scope) {
          existingPermission.scope = scope;
          await this.rolePermissionRepository.save(existingPermission);
        }
      }
      return role;
    };

    const roleGlobal = await createRole(
      'TestRoleGlobal',
      RolePermissionScopeEnum.GLOBAL,
    );
    const roleAny = await createRole(
      'TestRoleAny',
      RolePermissionScopeEnum.ANY,
    );
    const roleOwn = await createRole(
      'TestRoleOwn',
      RolePermissionScopeEnum.OWN,
    );

    // 3. Create Organizations
    const createOrg = async (name: string, parent?: Organization) => {
      let org = await this.organizationRepository.findOne({ where: { name } });
      if (!org) {
        org = await this.organizationRepository.save(
          this.organizationRepository.create({
            name,
            metadata: { tenantType: 'mono' },
            parent,
          }),
        );
      } else if (parent && (!org.parent || org.parent.id !== parent.id)) {
        org.parent = parent;
        await this.organizationRepository.save(org);
      }
      return org;
    };

    const orgA = await createOrg('Organization A');
    const orgB = await createOrg('Organization B', orgA);
    const orgC = await createOrg('Organization C', orgB);

    const orgD = await createOrg('Organization D');
    const orgE = await createOrg('Organization E', orgD);

    // 4. Create Users
    const createUser = async (email: string) => {
      let user = await this.userRepository.findOne({ where: { email } });
      const salt = await bcrypt.genSalt();
      const password = await bcrypt.hash('Teste@1234', salt);

      if (user) {
        user.password = password;
        return await this.userRepository.save(user);
      }

      user = await this.userRepository.save(
        this.userRepository.create({
          email,
          password,
          firstName: 'Test',
          lastName: email.split('@')[0],
          status: UserStatus.ACTIVE,
        }),
      );
      return user;
    };

    const userGlobalA = await createUser('global-a@test.com');
    const userGlobalB = await createUser('global-b@test.com');
    const userGlobalC = await createUser('global-c@test.com');
    const userGlobalD = await createUser('global-d@test.com');
    const userGlobalE = await createUser('global-e@test.com');

    const userAnyB = await createUser('any-b@test.com');
    const userOwnB = await createUser('own-b@test.com');
    const userAnyE = await createUser('any-e@test.com');

    // 5. Assign Roles
    const assign = async (user: User, role: Role, org: Organization | null) => {
      const existing = await this.userRoleAssignmentRepository.findOne({
        where: {
          userId: user.id,
          roleId: role.id,
          // Handle nullable organizationId explicitly if needed, but TypeORM Usually handles null value in object
          organizationId: org ? org.id : null,
        },
      });
      if (!existing) {
        await this.userRoleAssignmentRepository.save(
          this.userRoleAssignmentRepository.create({
            user,
            role,
            organization: org,
          }),
        );
      }
    };

    await assign(userGlobalA, roleGlobal, orgA);
    await assign(userGlobalB, roleGlobal, orgB);
    await assign(userGlobalC, roleGlobal, orgC);

    await assign(userAnyB, roleAny, orgB);
    await assign(userOwnB, roleOwn, orgB);

    await assign(userGlobalD, roleGlobal, orgD);
    await assign(userGlobalE, roleGlobal, orgE);

    await assign(userAnyE, roleAny, orgE);

    console.log('Test scenarios created.');
  }

  async run() {
    await this.createUserAssignment();
    return await this.createTestScenarios();
  }
}
