import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LayerSchema } from 'maps/layer-schemas/entities/layer-schema.entity';
import { LayerSchemasService } from 'maps/layer-schemas/layer-schemas.service';
import { Repository } from 'typeorm';
import { SearchConfigDto } from './dto/search.dto';
import { SearchConfig } from './entities/search-config.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(SearchConfig)
    private readonly repository: Repository<SearchConfig>,

    private readonly layerSchemaService: LayerSchemasService,
  ) {}

  async findAll(): Promise<SearchConfig[]> {
    return this.repository.find({
      relations: ['layerSchema'],
      order: { index: 'ASC' },
    });
  }

  async findOne(id: string): Promise<SearchConfig> {
    const group = await this.repository.findOneBy({ id });
    if (!group) {
      throw new NotFoundException(`Search Config with ID "${id}" not found`);
    }
    return group;
  }

  async create({
    id,
    index,
    name,
    origin,
    clickAction,
    isActive,
    layerSchemaId,
    method,
    transformParams,
    transformRequest,
    transformResponse,
  }: SearchConfigDto): Promise<SearchConfig> {
    const another = await this.repository.findOneBy({ id: id });
    if (another)
      throw new BadRequestException(
        `Search Config with ID ${id} already exist`,
      );

    if (!layerSchemaId && !clickAction)
      throw new BadRequestException(
        `The search configuration needs a clickAction or a layerSchemaId to know what to do when clicked.`,
      );

    let layerSchema: LayerSchema;
    if (layerSchemaId)
      layerSchema = await this.layerSchemaService.findOne(layerSchemaId);

    const entity = this.repository.create({
      id,
      index,
      name,
      origin,
      clickAction,
      isActive,
      layerSchemaId,
      method,
      transformParams: transformParams || null,
      transformRequest: transformRequest || null,
      transformResponse: transformResponse || null,
      layerSchema,
    });

    return this.repository.save(entity);
  }

  async update(
    id: string,
    {
      index,
      name,
      origin,
      clickAction,
      isActive,
      layerSchemaId,
      method,
      transformParams,
      transformRequest,
      transformResponse,
      ...dto
    }: SearchConfigDto,
  ): Promise<SearchConfig> {
    const searchConfig = await this.findOne(id);
    if (id !== dto.id) {
      const another = await this.repository.findOneBy({ id: dto.id });
      if (another)
        throw new BadRequestException(
          `Search Config with ID ${dto.id} already exist`,
        );
    }

    if (layerSchemaId) await this.layerSchemaService.findOne(layerSchemaId);

    searchConfig.id = id;
    searchConfig.index = index;
    searchConfig.name = name;
    searchConfig.origin = origin;
    searchConfig.clickAction = clickAction;
    searchConfig.isActive = isActive;
    searchConfig.layerSchemaId = layerSchemaId;
    searchConfig.method = method;
    searchConfig.transformParams = transformParams || null;
    searchConfig.transformRequest = transformRequest || null;
    searchConfig.transformResponse = transformResponse || null;

    if (layerSchemaId) {
      searchConfig.layerSchema =
        await this.layerSchemaService.findOne(layerSchemaId);
    } else {
      searchConfig.layerSchema = null;
    }

    return await this.repository.save(searchConfig);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async upsert(dto: SearchConfigDto): Promise<SearchConfig> {
    const existing = await this.repository.findOneBy({ id: dto.id });

    return existing ? await this.update(dto.id, dto) : this.create(dto);
  }
}
