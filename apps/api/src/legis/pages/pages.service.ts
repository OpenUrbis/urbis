import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { ILike, In, Repository } from 'typeorm';
import { CreateLegisPageDto } from './dto/create-legis-page.dto';
import { FindLegisPagesDto } from './dto/find-legis-pages.dto';
import { UpdateLegisPageDto } from './dto/update-legis-page.dto';
import { LegisPage } from './entities';

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(LegisPage)
    private readonly pagesRepository: Repository<LegisPage>,
  ) {}

  async create(
    createLegisPageDto: CreateLegisPageDto,
    userId?: string,
  ): Promise<LegisPage> {
    const page = this.pagesRepository.create({
      id: createLegisPageDto.id ?? randomUUID(),
      title: createLegisPageDto.title,
      slug:
        createLegisPageDto.slug ??
        this.buildSlug(createLegisPageDto.title, createLegisPageDto.type),
      type: createLegisPageDto.type ?? 'page',
      author: createLegisPageDto.author ?? 'Desconhecido',
      tags: createLegisPageDto.tags ?? [],
      categoryId: createLegisPageDto.categoryId ?? null,
      isPublic: createLegisPageDto.isPublic ?? false,
      content: createLegisPageDto.content,
      source: createLegisPageDto.source ?? null,
      entityType: createLegisPageDto.entityType ?? createLegisPageDto.type ?? null,
      entityData: createLegisPageDto.entityData ?? null,
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
    });

    return this.pagesRepository.save(page);
  }

  async findAll(
    query: FindLegisPagesDto,
  ): Promise<PaginatedResponse<LegisPage>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const queryBuilder = this.pagesRepository
      .createQueryBuilder('page')
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

    if (typeof query.isPublic === 'boolean') {
      queryBuilder.andWhere('page.isPublic = :isPublic', {
        isPublic: query.isPublic,
      });
    }

    if (query.author) {
      queryBuilder.andWhere('page.author ILIKE :author', {
        author: `%${query.author}%`,
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
      items,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<LegisPage> {
    const page = await this.pagesRepository.findOne({ where: { id } });

    if (!page) {
      throw new NotFoundException(`Legis page with ID ${id} not found`);
    }

    return page;
  }

  async findByIds(ids: string[]): Promise<LegisPage[]> {
    if (!ids.length) {
      return [];
    }

    return this.pagesRepository.find({
      where: { id: In(ids) },
      order: { updatedAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updateLegisPageDto: UpdateLegisPageDto,
    userId?: string,
  ): Promise<LegisPage> {
    const page = await this.findOne(id);
    this.ensureCanWrite(page, userId);

    Object.assign(page, {
      ...updateLegisPageDto,
      slug:
        updateLegisPageDto.slug ??
        (updateLegisPageDto.title
          ? this.buildSlug(updateLegisPageDto.title, page.type)
          : page.slug),
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

    return this.pagesRepository.save(page);
  }

  async remove(id: string, userId?: string): Promise<void> {
    const page = await this.findOne(id);
    this.ensureCanWrite(page, userId);
    await this.pagesRepository.softDelete(id);
  }

  async findPublicBySearchTerm(search: string): Promise<LegisPage[]> {
    return this.pagesRepository.find({
      where: [
        { isPublic: true, title: ILike(`%${search}%`) },
        { isPublic: true, content: ILike(`%${search}%`) },
      ],
      order: { updatedAt: 'DESC' },
      take: 100,
    });
  }

  private ensureCanWrite(page: LegisPage, userId?: string) {
    if (page.createdBy && userId && page.createdBy !== userId) {
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
}