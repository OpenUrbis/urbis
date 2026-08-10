import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../../../organization/entities/organization.entity';
import { UserRoleAssignment } from '../../../../role/entities/user-role-assignment.entity';
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
    const existingUser = await this.userRepository.findOne({
      where: { email: 'test@test.com' },
    });

    if (existingUser) {
      return existingUser;
    }

    const user = this.userRepository.create({
      email: 'test@test.com',
      password: 'Teste@123',
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

  async run() {
    return await this.createUserAssignment();
  }
}
