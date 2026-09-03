import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Raw, Repository } from 'typeorm';
import {
  LegisUsersService,
  type LegisUserSummaryMap,
} from '../shared/legis-users.service';
import { CreateLegisAuthorityDto } from './dto/create-legis-authority.dto';
import { LegisAuthorityResponseDto } from './dto/legis-authority-response.dto';
import { UpdateLegisAuthorityDto } from './dto/update-legis-authority.dto';
import { LegisAuthority } from './entities';
import { LegisPage } from '../pages/entities';

@Injectable()
export class AuthoritiesService {
  constructor(
    @InjectRepository(LegisAuthority)
    private readonly authoritiesRepository: Repository<LegisAuthority>,
    @InjectRepository(LegisPage)
    private readonly pagesRepository: Repository<LegisPage>,
    private readonly legisUsersService: LegisUsersService,
  ) {}

  async findAll(): Promise<LegisAuthorityResponseDto[]> {
    const authorities = await this.authoritiesRepository.find({
      order: {
        commonRefAbbr: 'ASC',
        complementAbbr: 'ASC',
        commonRefFull: 'ASC',
        complementFull: 'ASC',
        startDate: 'ASC',
      },
    });

    return this.withActorsMany(authorities);
  }

  async findOne(id: string): Promise<LegisAuthorityResponseDto> {
    return this.withActors(await this.findEntity(id));
  }

  async create(
    createLegisAuthorityDto: CreateLegisAuthorityDto,
    userId?: string,
  ): Promise<LegisAuthorityResponseDto> {
    const authority = this.authoritiesRepository.create({
      id: createLegisAuthorityDto.id ?? randomUUID(),
      ...createLegisAuthorityDto,
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
    });

    return this.withActors(await this.authoritiesRepository.save(authority));
  }

  async update(
    id: string,
    updateLegisAuthorityDto: UpdateLegisAuthorityDto,
    userId?: string,
  ): Promise<LegisAuthorityResponseDto> {
    const authority = await this.findEntity(id);

    Object.assign(authority, {
      ...updateLegisAuthorityDto,
      updatedBy: userId ?? authority.updatedBy,
    });

    return this.withActors(await this.authoritiesRepository.save(authority));
  }

  async remove(id: string): Promise<void> {
    await this.findEntity(id);

    const linkedCount = await this.pagesRepository.count({
      where: [
        {
          entityData: Raw((alias) => `${alias}->>'authorityId' = :id`, { id }),
        },
        { authorId: id },
      ],
    });

    if (linkedCount > 0) {
      throw new BadRequestException(
        `Não é possível excluir esta autoridade pois existem ${linkedCount} página(s) vinculada(s) a ela.`,
      );
    }

    await this.authoritiesRepository.softDelete(id);
  }

  private async findEntity(id: string): Promise<LegisAuthority> {
    const authority = await this.authoritiesRepository.findOne({
      where: { id },
    });

    if (!authority) {
      throw new NotFoundException(`Legis authority with ID ${id} not found`);
    }

    return authority;
  }

  private async withActors(
    authority: LegisAuthority,
  ): Promise<LegisAuthorityResponseDto> {
    const [hydrated] = await this.withActorsMany([authority]);

    return hydrated;
  }

  /** Single user lookup for the whole batch, so listing authorities stays cheap. */
  private async withActorsMany(
    authorities: LegisAuthority[],
  ): Promise<LegisAuthorityResponseDto[]> {
    if (!authorities.length) {
      return [];
    }

    const users = await this.legisUsersService.resolveMany(
      authorities.flatMap((authority) => [
        authority.createdBy,
        authority.updatedBy,
      ]),
    );

    return authorities.map((authority) => this.attachActors(authority, users));
  }

  private attachActors(
    authority: LegisAuthority,
    users: LegisUserSummaryMap,
  ): LegisAuthorityResponseDto {
    return Object.assign(new LegisAuthorityResponseDto(), authority, {
      createdByUser:
        (authority.createdBy && users.get(authority.createdBy)) || null,
      updatedByUser:
        (authority.updatedBy && users.get(authority.updatedBy)) || null,
    });
  }
}
