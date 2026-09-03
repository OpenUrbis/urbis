import {
  Inject,
  Injectable,
  ForbiddenException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import { Repository, EntityManager, In } from 'typeorm';
import { randomBytes, createHash } from 'crypto';
import { UserApiKey } from './entities/user-api-key.entity';
import { User } from './entities/user.entity';
import { Organization } from '../organization/entities/organization.entity';
import { RoleService } from 'role/role.service';
import { UserRoleAssignment } from 'role/entities/user-role-assignment.entity';
import { SYSTEM_ROLES } from 'common/constants/system-roles.const';

@Injectable()
export class UserApiKeyService {
  constructor(
    @InjectRepository(UserApiKey)
    private readonly repo: Repository<UserApiKey>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(forwardRef(() => RoleService))
    private readonly roleService: RoleService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async checkAdminPermissions(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    // 1. Bloqueia sumariamente qualquer operação para a entidade "Codata"
    const organization = await this.entityManager.findOne(Organization, {
      where: { id: organizationId },
    });

    if (organization && organization.name?.toLowerCase().includes('codata')) {
      throw new ForbiddenException(
        'Não é permitido gerenciar ou emitir chaves de API para a entidade Codata.',
      );
    }

    // 2. Administrador global possui permissão irrestrita
    const isGlobalAdmin = await this.roleService.hasSystemRole(
      userId,
      SYSTEM_ROLES.admin,
    );
    if (isGlobalAdmin) {
      return;
    }

    // 2. Verifica se possui atribuição de admin ou orgAdmin para essa entidade
    const count = await this.entityManager.count(UserRoleAssignment, {
      where: {
        userId,
        organizationId,
        roleId: In([SYSTEM_ROLES.admin, SYSTEM_ROLES.organizationAdmin]),
      },
    });

    if (count === 0) {
      throw new ForbiddenException(
        'Você precisa ser um administrador ou representante administrador desta entidade para gerenciar chaves de API.',
      );
    }
  }

  async createKey(
    userId: string,
    organizationId: string,
    name: string,
  ): Promise<{ plainKey: string; entity: Omit<UserApiKey, 'hashedKey'> }> {
    await this.checkAdminPermissions(userId, organizationId);

    const rawBytes = randomBytes(32).toString('hex');
    const plainKey = `urb_live_${rawBytes}`;

    const hashedKey = createHash('sha256').update(plainKey).digest('hex');
    const prefix = `${plainKey.substring(0, 13)}...${plainKey.substring(plainKey.length - 4)}`;

    const apiKey = this.repo.create({
      name,
      hashedKey,
      prefix,
      userId,
      organizationId,
    });

    const saved = await this.repo.save(apiKey);

    // Don't return hashedKey
    const { hashedKey: _, ...entityWithoutHash } = saved;

    return {
      plainKey,
      entity: entityWithoutHash as any,
    };
  }

  async listKeys(
    userId: string,
    organizationId: string,
  ): Promise<Omit<UserApiKey, 'hashedKey'>[]> {
    await this.checkAdminPermissions(userId, organizationId);

    return this.repo.find({
      where: { userId, organizationId },
      select: [
        'id',
        'name',
        'prefix',
        'createdAt',
        'lastUsedAt',
        'expiresAt',
        'userId',
        'organizationId',
      ],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async revokeKey(userId: string, keyId: string): Promise<void> {
    const key = await this.repo.findOne({ where: { id: keyId } });
    if (!key) {
      throw new NotFoundException('Chave de API não encontrada.');
    }

    await this.checkAdminPermissions(userId, key.organizationId);

    await this.repo.delete({ id: keyId });
  }

  async validateKey(
    plainKey: string,
    organizationId: string,
  ): Promise<User | null> {
    const hashedKey = createHash('sha256').update(plainKey).digest('hex');

    const keyRecord = await this.repo.findOne({
      where: { hashedKey, organizationId },
    });

    if (!keyRecord) return null;

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return null;
    }

    // Update lastUsedAt asynchronously
    this.repo
      .update(keyRecord.id, { lastUsedAt: new Date() })
      .catch((err) => console.error('Failed to update lastUsedAt:', err));

    return this.userRepo.findOne({
      where: { id: keyRecord.userId },
    });
  }
}
