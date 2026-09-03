import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'user/entities/user.entity';
import {
  LegisUserSummaryDto,
  toLegisUserSummary,
} from './dto/legis-user-summary.dto';

export type LegisUserSummaryMap = Map<string, LegisUserSummaryDto>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Legis stores people as bare uuids (`authorId`, `createdBy`, `updatedBy`).
 * This service turns those uuids into presentable summaries in a single query,
 * so a list of pages costs one extra round trip instead of one per row.
 */
@Injectable()
export class LegisUsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async resolveMany(
    ids: ReadonlyArray<string | null | undefined>,
  ): Promise<LegisUserSummaryMap> {
    const uniqueIds = Array.from(
      new Set(
        ids.filter(
          (id): id is string => typeof id === 'string' && UUID_PATTERN.test(id),
        ),
      ),
    );

    if (!uniqueIds.length) {
      return new Map();
    }

    const users = await this.usersRepository.find({
      where: { id: In(uniqueIds) },
      /*
       * Audit trails must keep naming the person even after the account is
       * removed, otherwise historical Legis content loses its authorship.
       */
      withDeleted: true,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        socialName: true,
        avatarUrl: true,
        status: true,
        deletedAt: true,
      },
    });

    return new Map(users.map((user) => [user.id, toLegisUserSummary(user)]));
  }

  async resolveOne(id?: string | null): Promise<LegisUserSummaryDto | null> {
    const summaries = await this.resolveMany([id]);

    return (id && summaries.get(id)) || null;
  }
}
