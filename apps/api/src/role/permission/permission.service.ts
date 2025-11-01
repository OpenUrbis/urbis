import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IPaginationOptions } from 'common/utils/types/pagination-options';
import { FindOptionsWhere, ILike, In, Not, Or, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  getFromArray(permissions: string[]) {
    return this.permissionRepository.find({
      where: { permission: In(permissions) },
    });
  }

  list(
    pagination: IPaginationOptions,
    search?: string,
    exclude?: string[],
  ): Promise<Permission[]> {
    const { limit, page } = pagination;
    const where: FindOptionsWhere<Permission> = {};

    if (search) where.name = Or(ILike(`%${search}%`));

    if (exclude && exclude?.length > 0) where.permission = Not(In(exclude));

    return this.permissionRepository.find({
      where: where,
      take: limit,
      skip: page * limit,
    });
  }
}
