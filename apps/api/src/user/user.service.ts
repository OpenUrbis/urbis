import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Inject,
  Optional,
  forwardRef,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'common/mail/mail.service';
import { MapUsageService } from 'common/map-usage/map-usage.service';
import {
  Brackets,
  FindOneOptions,
  FindOptionsWhere,
  Not,
  Repository,
} from 'typeorm';
import { IPaginationOptions } from '../common/utils/types/pagination-options';
import { Organization } from '../organization/entities/organization.entity';
import { RoleService } from '../role/role.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserStatus } from './enums/user-status.enum';
import { RepresentationService } from '../representation/representation.service';
import { AccessControl } from '../common/guards/access-control/access-control';
import { RolePermissionScopeEnum } from '../role/enums/role-permission-scope.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly mapUsageService: MapUsageService,
    private readonly configService: ConfigService,
    private readonly roleService: RoleService,
    private readonly mailService: MailService,
    @Optional()
    @Inject(forwardRef(() => RepresentationService))
    private readonly representationService?: RepresentationService,
  ) {}

  async create(
    createProfileDto: CreateUserDto | User,
    organization?: Organization,
  ) {
    try {
      const user = await this.usersRepository.save(
        this.usersRepository.create(createProfileDto),
      );

      console.log(
        `[AUDIT] [USER_CREATED] Who: System | When: ${new Date().toISOString()} | UserID: ${user.id} | Email: ${user.email} | CPF: ${user.cpf} | AccountType: ${user.accountType}`,
      );

      const systemOrgId = this.configService.get<string>(
        'admin.organization.id',
      );
      const defaultSystemRole = await this.roleService.findDefault();
      if (defaultSystemRole && systemOrgId) {
        await this.roleService.assign({
          userId: user.id,
          roleId: defaultSystemRole.id,
          organizationId: systemOrgId,
        });
      }

      if (organization && organization.id !== systemOrgId) {
        let defaultRole = await this.roleService.findDefault(organization.id);
        if (!defaultRole) defaultRole = defaultSystemRole;

        if (defaultRole) {
          await this.roleService.assignByOrganization(organization.id, {
            userId: user.id,
            roleIds: [defaultRole.id],
          });
        }
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
    search?: string,
    emailConfirmed?: boolean,
  ) {
    if (pagination.page > 0) pagination.page--;
    const { limit, page } = pagination;
    const where: FindOptionsWhere<User> = {};

    if (organizationId) where.userRoleAssignments = { organizationId };
    if (status) where.status = status;

    const qb = this.usersRepository
      .createQueryBuilder('usr')
      .leftJoinAndSelect(
        'usr.userRoleAssignments',
        'assignment',
        'usr.id::text = assignment."userId"::text',
      )
      .leftJoinAndSelect(
        'assignment.organization',
        'organization',
        'organization.id::text = assignment."organizationId"::text',
      )
      .leftJoinAndSelect(
        'assignment.role',
        'role',
        'role.id::text = assignment."roleId"::text',
      )
      .where('usr."deletedAt" IS NULL');
    if (organizationId)
      qb.andWhere('assignment."organizationId" = :organizationId', {
        organizationId,
      });
    if (status) qb.andWhere('usr."status" = :status', { status });
    if (emailConfirmed !== undefined) {
      qb.andWhere(
        emailConfirmed
          ? 'usr."emailHashConfirm" IS NULL'
          : 'usr."emailHashConfirm" IS NOT NULL',
      );
    }
    if (search?.trim()) {
      const normalizedSearch = search.trim();
      const digitsSearch = normalizedSearch.replace(/\D/g, '');
      qb.andWhere(
        new Brackets((subQb) => {
          subQb
            .where('usr."firstName" ILIKE :textSearch', {
              textSearch: `%${normalizedSearch}%`,
            })
            .orWhere('usr."lastName" ILIKE :textSearch', {
              textSearch: `%${normalizedSearch}%`,
            })
            .orWhere('usr."socialName" ILIKE :textSearch', {
              textSearch: `%${normalizedSearch}%`,
            })
            .orWhere(
              `CONCAT(usr."firstName", ' ', usr."lastName") ILIKE :textSearch`,
              { textSearch: `%${normalizedSearch}%` },
            )
            .orWhere('usr.email ILIKE :textSearch', {
              textSearch: `%${normalizedSearch}%`,
            });

          if (digitsSearch) {
            subQb.orWhere(
              `regexp_replace(COALESCE(usr."cpf", ''), '[^0-9]', '', 'g') ILIKE :documentSearch`,
              { documentSearch: `%${digitsSearch}%` },
            );
          }
        }),
      );
    }
    const [data, total] = await qb
      .take(limit)
      .skip(page * limit)
      .getManyAndCount();
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

  async update(
    id: string,
    updateProfileDto: UpdateUserDto,
    accessControl?: AccessControl,
  ) {
    const existingUser = await this.findOne({ id });
    if (!existingUser)
      throw new NotFoundException({ message: 'User is not found' });

    const sensitiveFields = ['accountType', 'birthDate'] as const;
    const changedSensitiveFields = sensitiveFields.filter(
      (field) =>
        updateProfileDto[field] !== undefined &&
        updateProfileDto[field] !== (existingUser as any)[field],
    );

    if (changedSensitiveFields.length > 0) {
      if (
        !accessControl ||
        !accessControl.hasPermission({
          permissions: {
            id: 'user:update',
            resource: 'user',
            action: 'update',
            scope: RolePermissionScopeEnum.ANY,
          },
        })
      ) {
        throw new BadRequestException(
          'Você não tem permissão para alterar os campos sensíveis do usuário',
        );
      }
      if (!updateProfileDto.sensitiveChangeJustification?.trim()) {
        throw new BadRequestException(
          'Informe a justificativa para alterar o tipo de cadastro ou a data de nascimento',
        );
      }
      if (
        updateProfileDto.sensitiveChangeAttachments?.some(
          (key) => !key.startsWith('uploads/') || key.includes('..'),
        )
      ) {
        throw new BadRequestException('Anexo comprobatório inválido');
      }
    }

    const {
      sensitiveChangeJustification,
      sensitiveChangeAttachments,
      metadata,
      ...profileUpdate
    } = updateProfileDto;

    if (
      profileUpdate.email !== undefined &&
      profileUpdate.email.trim().toLowerCase() !==
        (existingUser.email || '').trim().toLowerCase()
    ) {
      if (
        !accessControl ||
        !accessControl.hasPermission({
          permissions: {
            id: 'user:update',
            resource: 'user',
            action: 'update',
            scope: RolePermissionScopeEnum.ANY,
          },
        })
      ) {
        throw new BadRequestException(
          'Apenas administradores podem alterar o e-mail de usuários',
        );
      }

      const normalizedEmail = profileUpdate.email.trim().toLowerCase();
      const duplicateUser = await this.usersRepository.findOne({
        where: { email: normalizedEmail, id: Not(id) },
      });
      if (duplicateUser) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'alreadyExists',
          },
        });
      }
      profileUpdate.email = normalizedEmail;
    }
    const changes: Record<string, { old: any; new: any }> = {};
    if (existingUser) {
      for (const key of Object.keys(profileUpdate)) {
        const newVal = (profileUpdate as any)[key];
        const oldVal = (existingUser as any)[key];
        if (
          newVal !== undefined &&
          JSON.stringify(newVal) !== JSON.stringify(oldVal)
        ) {
          changes[key] = { old: oldVal, new: newVal };
        }
      }
    }

    const updateData: Record<string, any> = {
      id,
      ...profileUpdate,
    };

    if (metadata !== undefined) {
      updateData.metadata = { ...(existingUser.metadata || {}), ...metadata };
    }

    if (changedSensitiveFields.length > 0) {
      updateData.metadata = {
        ...(updateData.metadata || existingUser.metadata || {}),
        sensitiveChanges: [
          ...((existingUser.metadata?.sensitiveChanges as any[]) || []),
          {
            fields: changedSensitiveFields,
            justification: sensitiveChangeJustification.trim(),
            attachments: sensitiveChangeAttachments || [],
            changedAt: new Date().toISOString(),
          },
        ],
      };
    }

    await this.usersRepository.update({ id }, updateData);

    console.log(
      `[AUDIT] [USER_UPDATED] Who: Self/System | When: ${new Date().toISOString()} | Target User: ${id} | Changes: ${JSON.stringify(
        changes,
      )}`,
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
    const user = await this.findOne({ id });
    if (!user) throw new NotFoundException({ message: 'User is not found' });
    if (this.representationService) {
      await this.representationService.inactivateForUserDeletion(user);
    }
    // Preserve audit foreign keys while invalidating every authentication identifier.
    // This frees CPF/e-mail for a new account without restoring prior representations.
    await this.usersRepository.update(id, {
      email: `deleted+${id}@invalid.urbis`,
      cpf: null,
      password: null,
      emailHashConfirm: null,
      otpSecret: null,
      requires2fa: false,
      otpValidated: false,
    });
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

  async getUsage(user: any, _organization?: Organization) {
    const userId = user.id || user._id;

    // The map proxy quota is tracked independently from Nest's hashed
    // throttler keys, so the usage panel reads the exact same counter.
    const dailyLimit =
      this.configService.get<number>(
        'throttler.proxy.authenticated.daily.limit',
      ) || 1000;
    const currentUsage = await this.mapUsageService.getDailyUsage(
      `user:${userId}`,
    );

    return {
      userId: user.id,
      dailyLimit,
      currentUsage,
      remaining: Math.max(dailyLimit - currentUsage, 0),
    };
  }
}
