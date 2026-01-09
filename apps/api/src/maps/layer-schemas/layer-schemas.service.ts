import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LayerGroupsService } from 'maps/layer-groups/layer-groups.service';
import { ILike, Repository } from 'typeorm';
import { LayerSchemaDto } from './dto/layer-schema.dto';
import { LayerSchema } from './entities/layer-schema.entity';

@Injectable()
export class LayerSchemasService {
  constructor(
    @InjectRepository(LayerSchema)
    private readonly repository: Repository<LayerSchema>,

    private readonly layerGroupsService: LayerGroupsService,
  ) {}

  async findAll(
    page?: number,
    pageSize?: number,
    search?: string,
  ): Promise<LayerSchema[] | { data: LayerSchema[]; total: number }> {
    const where = search ? { name: ILike(`%${search}%`) } : {};

    if (page && pageSize) {
      const take = pageSize;
      const skip = (page - 1) * pageSize;
      const [data, total] = await this.repository.findAndCount({
        where,
        relations: ['colors', 'layerGroup'],
        order: { isActive: 'DESC' },
        take,
        skip,
      });
      return { data, total };
    }
    return this.repository.find({
      where,
      relations: ['colors', 'layerGroup'],
      order: { isActive: 'DESC' },
    });
  }

  async findOne(id: string): Promise<LayerSchema> {
    const schema = await this.repository.findOne({
      where: { id },
      relations: ['colors'],
    });
    if (!schema) {
      throw new NotFoundException(`Layer schema with ID "${id}" not found`);
    }
    return schema;
  }

  async create({
    id,
    name,
    origin,
    isActive,
    type,
    isVisible,
    minZoom,
    getTextColorPropName,
    getFillColorPropName,
    getLineColorPropName,
    clickAction,
    viewTemplate,
    properties,
    groupId,
    colors,
  }: LayerSchemaDto): Promise<LayerSchema> {
    const another = await this.repository.findOneBy({ id: id });
    if (another)
      throw new BadRequestException(`Layer schema with ID ${id} already exist`);

    const layerGroup = await this.layerGroupsService.checkOwnerGroup(groupId);

    const entity = this.repository.create({
      id,
      name,
      origin,
      isActive,
      type,
      isVisible,
      minZoom,
      getTextColorPropName,
      getFillColorPropName,
      getLineColorPropName,
      clickAction,
      viewTemplate,
      properties,
      groupId,
      layerGroup,
      colors,
    });

    return this.repository.save(entity);
  }

  async update(
    id: string,
    {
      name,
      origin,
      isActive,
      type,
      isVisible,
      minZoom,
      getTextColorPropName,
      getFillColorPropName,
      getLineColorPropName,
      clickAction,
      viewTemplate,
      properties,
      groupId,
      colors,

      ...dto
    }: LayerSchemaDto,
  ): Promise<LayerSchema> {
    const layerSchema = await this.findOne(id);
    if (id !== dto.id) {
      const another = await this.repository.findOneBy({ id: dto.id });
      if (another)
        throw new BadRequestException(
          `Layer schema with ID ${dto.id} already exist`,
        );
    }
    const layerGroup = await this.layerGroupsService.checkOwnerGroup(groupId);

    layerSchema.id = dto.id;
    layerSchema.name = name;
    layerSchema.origin = origin;
    layerSchema.isActive = isActive;
    layerSchema.type = type;
    layerSchema.isVisible = isVisible;
    layerSchema.minZoom = minZoom;
    layerSchema.getTextColorPropName = getTextColorPropName;
    layerSchema.getFillColorPropName = getFillColorPropName;
    layerSchema.getLineColorPropName = getLineColorPropName;
    layerSchema.clickAction = clickAction;
    layerSchema.viewTemplate = viewTemplate;
    layerSchema.properties = properties;
    layerSchema.groupId = groupId;
    layerSchema.layerGroup = layerGroup;
    layerSchema.colors = colors;

    return await this.repository.save(layerSchema);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async upsert(dto: LayerSchemaDto): Promise<LayerSchema> {
    const existing = await this.repository.findOneBy({ id: dto.id });

    return existing ? await this.update(dto.id, dto) : this.create(dto);
  }
}
