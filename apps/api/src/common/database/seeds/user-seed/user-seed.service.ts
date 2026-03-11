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
    const org = this.organizationRepository.create({
      name: 'John organization',
    });

    return await this.organizationRepository.save(org);
  }

  async createUser() {
    const user = this.userRepository.create({
      email: 'test@test.com',
      password: 'Teste@1234',
      firstName: 'John',
      lastName: 'Dom',
      status: UserStatus.ACTIVE,
    });

    return await this.userRepository.save(user);
  }

  async createUserAssignment() {
    const org = await this.createOrg();
    const user = await this.createUser();
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
