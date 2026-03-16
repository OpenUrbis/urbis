import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'common/mail/mail.service';
import { RedisService } from 'common/redis/redis.service';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { IPaginationOptions } from '../common/utils/types/pagination-options';
import { Organization } from '../organization/entities/organization.entity';
import { RoleService } from '../role/role.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserStatus } from './enums/user-status.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly redisService: RedisService,
    private readonly roleService: RoleService,
    private readonly mailService: MailService,
  ) {}

  async create(
    createProfileDto: CreateUserDto | User,
    organization?: Organization,
  ) {
    try {
      const user = await this.usersRepository.save(
        this.usersRepository.create(createProfileDto),
      );

      if (organization) {
        let defaultRole = await this.roleService.findDefault(organization.id);
        if (!defaultRole) defaultRole = await this.roleService.findDefault();

        await this.roleService.assignByOrganization(organization.id, {
          userId: user.id,
          roleIds: [defaultRole.id],
        });
      }

      return user;
    } catch (error) {
      if (
        error?.code === '23505' || // Postgres unique violation
        error?.message?.includes('duplicate key')
      ) {
        if (error.detail?.includes('cpf') || error.message?.includes('cpf')) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              cpf: 'alreadyExists',
            },
          });
        }
        if (
          error.detail?.includes('email') ||
          error.message?.includes('email')
        ) {
          throw new UnprocessableEntityException({
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            errors: {
              email: 'alreadyExists',
            },
          });
        }
      }
      throw error;
    }
  }

  async list(
    pagination: IPaginationOptions,
    organizationId?: string,
    status?: UserStatus,
  ) {
    if (pagination.page > 0) pagination.page--;
    const { limit, page } = pagination;
    const where: FindOptionsWhere<User> = {};

    if (organizationId) where.userRoleAssignments = { organizationId };
    if (status) where.status = status;

    const [data, total] = await this.usersRepository.findAndCount({
      where,
      take: limit,
      skip: page * limit,
    });

    return { data, total };
  }

  findOne(
    fields: FindOptionsWhere<User>,
    findOptions: FindOneOptions<User> = {},
  ) {
    return this.usersRepository.findOne({
      ...findOptions,
      where: fields,
      relations: [
        'userRoleAssignments.role',
        'userRoleAssignments.organization',
      ],
    });
  }

  save(user: User) {
    return this.usersRepository.save(user);
  }

  async update(id: string, updateProfileDto: UpdateUserDto) {
    await this.usersRepository.update(
      { id },
      {
        id,
        ...updateProfileDto,
      },
    );

    return this.findOne({ id });
  }

  async updateStatus(id: string, status: UserStatus) {
    const user = await this.findOne({ id });
    if (!user) throw new NotFoundException({ message: 'User is not found' });
    user.status = status;
    await user.save();

    if (status === UserStatus.ACTIVE) {
      await this.mailService.accountApproved(user.email, user.firstName);
    }
    return user;
  }

  async softDelete(id: string): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  findByIdAndUpdate(id: string, updateDto: UpdateUserDto) {
    return this.usersRepository.update({ id }, updateDto);
  }

  async saveOtpSecret(userId: string, secret: string) {
    const user = await this.findOne({ id: userId });
    if (!user) throw new NotFoundException({ message: 'User is not found' });

    user.otpSecret = secret;
    user.requires2fa = true;

    return this.usersRepository.save(user);
  }

  async otpSecretIsValidated(userId: string) {
    const user = await this.findOne({ id: userId });

    user.otpValidated = true;

    return await this.usersRepository.save(user);
  }

  async remove2FA(userId: string) {
    const user = await this.findOne({ id: userId });

    user.otpValidated = false;
    user.requires2fa = false;
    user.otpSecret = null;

    return await this.usersRepository.save(user);
  }

  async confirmEmail(userId: string) {
    const user = await this.findOne({ id: userId });

    if (!user) throw new NotFoundException({ message: 'User is not found' });

    user.emailHashConfirm = null;
    await this.save(user);
  }

  async getUsage(user: any) {
    const userId = user.id || user._id;
    const tracker = `user:${userId}`;

    const dailyLimit = 1000; // This could be fetched from ConfigService
    const dailyKey = `throttler:daily:${tracker}`;
    const usage = await this.redisService.get(dailyKey);

    return {
      userId: user.id,
      dailyLimit,
      currentUsage: usage ? usage.totalHits : 0,
      remaining: dailyLimit - (usage ? usage.totalHits : 0),
    };
  }
}
