import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { FindOneOptions, FindOptionsWhere, In, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createProfileDto: CreateUserDto | User) {
    return this.usersRepository.save(
      this.usersRepository.create(createProfileDto),
    );
  }

  async list(
    pagination: IPaginationOptions,
    organizationId?: string,
    allowedOrganizationIds?: string[],
  ) {
    if (pagination.page > 0) pagination.page--;
    const { limit, page } = pagination;

    const query = this.usersRepository.createQueryBuilder('user');
    query.leftJoin('user.userRoleAssignments', 'ura');

    if (organizationId) {
      if (
        allowedOrganizationIds &&
        !allowedOrganizationIds.includes(organizationId)
      ) {
        return { data: [], total: 0 };
      }
      query.andWhere('ura.organizationId = :organizationId', {
        organizationId,
      });
    } else if (allowedOrganizationIds) {
      if (allowedOrganizationIds.length === 0) {
        return { data: [], total: 0 };
      }
      query.andWhere('ura.organizationId IN (:...allowedIds)', {
        allowedIds: allowedOrganizationIds,
      });
    }

    query.skip(page * limit).take(limit);
    query.orderBy('user.firstName', 'ASC');

    const [data, total] = await query.getManyAndCount();

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

  update(id: string, updateProfileDto: UpdateUserDto) {
    return this.usersRepository.update(
      { id },
      {
        id,
        ...updateProfileDto,
      },
    );
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
}
