import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../../../user/entities/user.entity';
import { UserRoleAssignment } from '../../../../role/entities/user-role-assignment.entity';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../../../../user/enums/user-status.enum';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';

@Injectable()
export class SystemUserSeedService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(UserRoleAssignment)
    private userRoleAssignmentRepository: Repository<UserRoleAssignment>,

    private configService: ConfigService,
  ) {}

  private async createUser() {
    const email = this.configService.get('admin.account.email');
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      return existingUser;
    }

    const configuredPassword = this.configService.get<string>(
      'admin.account.password',
    );
    if (!configuredPassword) {
      throw new Error(
        'ADMIN_ACCOUNT_PASSWORD must be configured to run the system user seed',
      );
    }

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(configuredPassword, salt);

    const user = this.userRepository.create({
      email,
      firstName: 'John',
      lastName: 'Dom',
      password,
      status: UserStatus.ACTIVE,
      country: 'BR',
      phone: '00000000000',
    });

    return this.userRepository.save(user);
  }

  private async createUserAssignment() {
    const user = await this.createUser();
    const roleId = SYSTEM_ROLES.admin;
    const organizationId = this.configService.get('admin.organization.id');

    const existingAssign = await this.userRoleAssignmentRepository.findOne({
      where: {
        organizationId,
        userId: user.id,
        roleId,
      },
    });

    if (existingAssign) {
      return existingAssign;
    }

    const assign = this.userRoleAssignmentRepository.create({
      organizationId,
      userId: user.id,
      roleId,
    });

    return this.userRoleAssignmentRepository.save(assign);
  }

  run() {
    return this.createUserAssignment();
  }
}
