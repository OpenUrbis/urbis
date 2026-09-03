import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { ILike, In, Repository } from 'typeorm';
import { type LegisUserSummaryDto } from '../shared/dto/legis-user-summary.dto';
import { isLegisAdmin, type LegisActor } from '../shared/legis-actor';
import {
  LegisUsersService,
  type LegisUserSummaryMap,
} from '../shared/legis-users.service';
import { CreateLegisPageDto } from './dto/create-legis-page.dto';
import { FindLegisPagesDto } from './dto/find-legis-pages.dto';
import { LegisPageResponseDto } from './dto/legis-page-response.dto';
import { UpdateLegisPageDto } from './dto/update-legis-page.dto';
import { LegisPage } from './entities';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

const FALLBACK_AUTHOR_LABEL = 'Desconhecido';

@Injectable()
export class PagesService {
  private readonly logger = new Logger(PagesService.name);

  constructor(
    @InjectRepository(LegisPage)
    private readonly pagesRepository: Repository<LegisPage>,
    private readonly legisUsersService: LegisUsersService,
  ) {}

  async create(
    createLegisPageDto: CreateLegisPageDto,
    actor?: LegisActor,
  ): Promise<LegisPageResponseDto> {
    const userId = actor?.id;
    /*
     * The author is the authenticated user by default; an explicit `authorId`
     * only matters when an admin registers content on behalf of someone else.
     */
    const authorId = createLegisPageDto.authorId ?? userId ?? null;
    const authorUser = await this.legisUsersService.resolveOne(authorId);

    const initialSlug =
      createLegisPageDto.slug ??
      this.buildSlug(createLegisPageDto.title, createLegisPageDto.type);
    const slug = await this.ensureUniqueSlug(initialSlug);

    const pageType = createLegisPageDto.type ?? 'page';
    if (pageType === 'original_normativo') {
      const normativeType = createLegisPageDto.entityData?.normativeType;
      if (typeof normativeType !== 'string' || !normativeType.trim()) {
        throw new BadRequestException(
          'O campo Tipo normativo é obrigatório para originais normativos.',
        );
      }
    }

    const page = this.pagesRepository.create({
      id: createLegisPageDto.id ?? randomUUID(),
      title: createLegisPageDto.title,
      slug,
      type: createLegisPageDto.type ?? 'page',
      authorId,
      author: this.resolveAuthorLabel(createLegisPageDto.author, authorUser),
      tags: createLegisPageDto.tags ?? [],
      categoryId: createLegisPageDto.categoryId ?? null,
      isPublic: createLegisPageDto.isPublic ?? false,
      content: createLegisPageDto.content,
      source: createLegisPageDto.source ?? null,
      entityType:
        createLegisPageDto.entityType ?? createLegisPageDto.type ?? null,
      entityData: createLegisPageDto.entityData ?? null,
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
    });

    const createdPage = await this.pagesRepository.save(page);

    return this.withAuthors(createdPage);
  }

  async findAll(
    query: FindLegisPagesDto,
    actor?: LegisActor,
  ): Promise<PaginatedResponse<LegisPageResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const queryBuilder = this.pagesRepository.createQueryBuilder('page');

    if (query.withDeleted) {
      if (!isLegisAdmin(actor)) {
        throw new ForbiddenException(
          'Only administrators can see deleted items.',
        );
      }
      queryBuilder.withDeleted();
    }

    queryBuilder
      .orderBy('page.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.ids?.length) {
      queryBuilder.andWhere('page.id IN (:...ids)', { ids: query.ids });
    }

    if (query.type) {
      queryBuilder.andWhere('page.type = :type', { type: query.type });
    }

    if (query.categoryId) {
      queryBuilder.andWhere('page.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (isLegisAdmin(actor)) {
      if (typeof query.isPublic === 'boolean') {
        queryBuilder.andWhere('page.isPublic = :isPublic', {
          isPublic: query.isPublic,
        });
      }
    } else {
      queryBuilder.andWhere('page.isPublic = :isPublic', {
        isPublic: true,
      });
    }

    if (query.author) {
      queryBuilder.andWhere('page.author ILIKE :author', {
        author: `%${query.author}%`,
      });
    }

    if (query.authorId) {
      queryBuilder.andWhere('page.authorId = :authorId', {
        authorId: query.authorId,
      });
    }

    if (query.search) {
      queryBuilder.andWhere(
        `(
          page.title ILIKE :search OR
          page.content ILIKE :search OR
          CAST(page.entityData AS text) ILIKE :search
        )`,
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: await this.withAuthorsMany(items),
      total,
      page,
      limit,
    };
  }

  async findOne(
    id: string,
    withDeleted = false,
    actor?: LegisActor,
  ): Promise<LegisPageResponseDto> {
    if (withDeleted && !isLegisAdmin(actor)) {
      throw new ForbiddenException(
        'Only administrators can view deleted items.',
      );
    }
    const page = await this.findEntity(id, withDeleted);
    if (!page.isPublic && !isLegisAdmin(actor)) {
      throw new ForbiddenException(
        'You do not have permission to view this Legis page.',
      );
    }
    return this.withAuthors(page);
  }

  async findByIds(
    ids: string[],
    actor?: LegisActor,
  ): Promise<LegisPageResponseDto[]> {
    if (!ids.length) {
      return [];
    }

    const where: any = { id: In(ids) };
    if (!isLegisAdmin(actor)) {
      where.isPublic = true;
    }

    const pages = await this.pagesRepository.find({
      where,
      order: { updatedAt: 'DESC' },
    });

    return this.withAuthorsMany(pages);
  }

  async update(
    id: string,
    updateLegisPageDto: UpdateLegisPageDto,
    actor?: LegisActor,
  ): Promise<LegisPageResponseDto> {
    const userId = actor?.id;
    const page = await this.findEntity(id);
    this.ensureCanWrite(page, actor);

    const isNormative =
      (updateLegisPageDto.type ?? page.type) === 'original_normativo';
    if (isNormative && updateLegisPageDto.entityData) {
      const normativeType = updateLegisPageDto.entityData.normativeType;
      if (typeof normativeType !== 'string' || !normativeType.trim()) {
        throw new BadRequestException(
          'O campo Tipo normativo é obrigatório para originais normativos.',
        );
      }
    }

    const updatedFields = Object.entries(updateLegisPageDto)
      .filter(([, value]) => value !== undefined)
      .map(([key]) => key)
      .sort();

    const requestedBackupPayload = {
      event: 'legis_page_update_requested',
      pageId: page.id,
      type: page.type,
      userId: userId ?? 'anonymous',
      updatedFields,
      before: {
        title: page.title,
        content: page.content,
        entityData: page.entityData,
        normativeElements: this.extractNormativeElements(page.entityData),
      },
      requestedAfter: {
        title: updateLegisPageDto.title ?? page.title,
        content: updateLegisPageDto.content ?? page.content,
        entityData: updateLegisPageDto.entityData ?? page.entityData,
        normativeElements: this.extractNormativeElements(
          updateLegisPageDto.entityData ?? page.entityData,
        ),
      },
    };

    this.logger.log(
      `Legis page update requested: id=${page.id} type=${page.type} currentTitle="${page.title}" nextTitle="${updateLegisPageDto.title ?? page.title}" fields=[${updatedFields.join(', ')}] userId=${userId ?? 'anonymous'}`,
    );
    this.logger.log(this.stringifyLogPayload(requestedBackupPayload));

    const nextAuthorId =
      updateLegisPageDto.authorId !== undefined
        ? updateLegisPageDto.authorId
        : page.authorId;
    /*
     * The label is only recomputed when the credited user changes, so a manual
     * label (imported content, collective authorship) survives other edits.
     */
    const nextAuthorUser =
      nextAuthorId && nextAuthorId !== page.authorId
        ? await this.legisUsersService.resolveOne(nextAuthorId)
        : null;

    const nextSlug = updateLegisPageDto.slug
      ? await this.ensureUniqueSlug(updateLegisPageDto.slug, page.id)
      : updateLegisPageDto.title && updateLegisPageDto.title !== page.title
        ? await this.ensureUniqueSlug(
            this.buildSlug(updateLegisPageDto.title, page.type),
            page.id,
          )
        : await this.ensureUniqueSlug(page.slug, page.id);

    Object.assign(page, {
      ...updateLegisPageDto,
      slug: nextSlug,
      authorId: nextAuthorId ?? null,
      author: this.resolveAuthorLabel(
        updateLegisPageDto.author,
        nextAuthorUser,
        page.author,
      ),
      categoryId:
        updateLegisPageDto.categoryId !== undefined
          ? updateLegisPageDto.categoryId
          : page.categoryId,
      source:
        updateLegisPageDto.source !== undefined
          ? updateLegisPageDto.source
          : page.source,
      entityType:
        updateLegisPageDto.entityType !== undefined
          ? updateLegisPageDto.entityType
          : page.entityType,
      entityData:
        updateLegisPageDto.entityData !== undefined
          ? updateLegisPageDto.entityData
          : page.entityData,
      updatedBy: userId ?? page.updatedBy,
    });

    const updatedPage = await this.pagesRepository.save(page);

    const persistedBackupPayload = {
      event: 'legis_page_updated',
      pageId: updatedPage.id,
      type: updatedPage.type,
      userId: userId ?? 'anonymous',
      updatedFields,
      persisted: {
        title: updatedPage.title,
        content: updatedPage.content,
        entityData: updatedPage.entityData,
        normativeElements: this.extractNormativeElements(
          updatedPage.entityData,
        ),
      },
    };

    this.logger.log(
      `Legis page updated: id=${updatedPage.id} type=${updatedPage.type} title="${updatedPage.title}" fields=[${updatedFields.join(', ')}] userId=${userId ?? 'anonymous'}`,
    );
    this.logger.log(this.stringifyLogPayload(persistedBackupPayload));

    return this.withAuthors(updatedPage);
  }

  async remove(id: string, actor?: LegisActor): Promise<void> {
    const page = await this.findEntity(id);
    this.ensureCanWrite(page, actor);
    await this.pagesRepository.softDelete(id);
  }

  async restore(id: string, actor?: LegisActor): Promise<LegisPageResponseDto> {
    if (!isLegisAdmin(actor)) {
      throw new ForbiddenException('Only administrators can restore pages.');
    }
    await this.findEntity(id, true);
    await this.pagesRepository.restore(id);
    return this.findOne(id, false, actor);
  }

  async hardDelete(id: string, actor?: LegisActor): Promise<void> {
    if (!isLegisAdmin(actor)) {
      throw new ForbiddenException(
        'Only administrators can permanently delete pages.',
      );
    }
    const page = await this.findEntity(id, true);
    await this.pagesRepository.delete(page.id);
  }

  async findPublicBySearchTerm(
    search: string,
  ): Promise<LegisPageResponseDto[]> {
    const pages = await this.pagesRepository.find({
      where: [
        { isPublic: true, title: ILike(`%${search}%`) },
        { isPublic: true, content: ILike(`%${search}%`) },
      ],
      order: { updatedAt: 'DESC' },
      take: 100,
    });

    return this.withAuthorsMany(pages);
  }

  /**
   * Attaches the hydrated author/audit users to a single page.
   */
  async withAuthors(page: LegisPage): Promise<LegisPageResponseDto> {
    const [hydrated] = await this.withAuthorsMany([page]);

    return hydrated;
  }

  /**
   * Hydrates a batch of pages with a single user lookup, so listing 100 pages
   * never turns into 300 queries.
   */
  async withAuthorsMany(pages: LegisPage[]): Promise<LegisPageResponseDto[]> {
    if (!pages.length) {
      return [];
    }

    const users = await this.legisUsersService.resolveMany(
      pages.flatMap((page) => [page.authorId, page.createdBy, page.updatedBy]),
    );

    return pages.map((page) => this.attachAuthors(page, users));
  }

  private attachAuthors(
    page: LegisPage,
    users: LegisUserSummaryMap,
  ): LegisPageResponseDto {
    const authorUser = page.authorId ? users.get(page.authorId) : undefined;

    return Object.assign(new LegisPageResponseDto(), page, {
      authorUser: authorUser ?? null,
      createdByUser: (page.createdBy && users.get(page.createdBy)) || null,
      updatedByUser: (page.updatedBy && users.get(page.updatedBy)) || null,
      /*
       * The stored label can go stale (the person renamed their account), so the
       * resolved user always wins when there is one.
       */
      author: authorUser?.name ?? page.author ?? FALLBACK_AUTHOR_LABEL,
    });
  }

  private async findEntity(
    idOrSlug: string,
    withDeleted = false,
  ): Promise<LegisPage> {
    const page = await this.pagesRepository.findOne({
      where: [{ id: idOrSlug }, { slug: idOrSlug }],
      withDeleted,
    });

    if (!page) {
      throw new NotFoundException(
        `Legis page with ID or slug ${idOrSlug} not found`,
      );
    }

    return page;
  }

  private resolveAuthorLabel(
    requestedLabel: string | undefined,
    authorUser: LegisUserSummaryDto | null,
    currentLabel?: string,
  ): string {
    return (
      requestedLabel?.trim() ||
      authorUser?.name ||
      currentLabel?.trim() ||
      FALLBACK_AUTHOR_LABEL
    );
  }

  /**
   * Legis pages are institutional content maintained collectively: any Legis
   * administrator may edit or remove a page, regardless of who created it.
   * The ownership rule only applies to non-admin actors.
   */
  private ensureCanWrite(page: LegisPage, actor?: LegisActor) {
    if (isLegisAdmin(actor)) {
      return;
    }

    const owner = page.createdBy ?? page.authorId;

    if (owner && actor?.id && owner !== actor.id) {
      throw new ForbiddenException(
        'You do not have permission to modify this Legis page',
      );
    }
  }

  private buildSlug(title: string, type?: string) {
    const normalizedTitle = title
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');

    if (normalizedTitle) {
      return normalizedTitle;
    }

    return `${type ?? 'page'}-${Date.now()}`;
  }

  private async ensureUniqueSlug(
    baseSlug: string,
    excludeId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const queryBuilder = this.pagesRepository
        .createQueryBuilder('page')
        .withDeleted()
        .where('page.slug = :slug', { slug });

      if (excludeId) {
        queryBuilder.andWhere('page.id != :excludeId', { excludeId });
      }

      const existing = await queryBuilder.getOne();

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  private extractNormativeElements(entityData: unknown) {
    if (!entityData || typeof entityData !== 'object') {
      return null;
    }

    const elements = (entityData as { elements?: unknown }).elements;

    return elements ?? null;
  }

  private stringifyLogPayload(payload: unknown) {
    try {
      return JSON.stringify(payload);
    } catch {
      return JSON.stringify({
        event: 'legis_page_update_log_error',
        message: 'Failed to serialize log payload',
      });
    }
  }
}
