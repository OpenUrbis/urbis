import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LayerGroupsService } from 'maps/layer-groups/layer-groups.service';
import { Repository } from 'typeorm';
import { LayerSchemaDto } from './dto/layer-schema.dto';
import { LayerSchema } from './entities/layer-schema.entity';
import { AccessControl } from 'common/guards/access-control/access-control';

@Injectable()
export class LayerSchemasService {
  constructor(
    @InjectRepository(LayerSchema)
    private readonly repository: Repository<LayerSchema>,

    private readonly layerGroupsService: LayerGroupsService,
  ) {}

  async findAll(
    accessControl?: AccessControl,
    page?: number,
    pageSize?: number,
    search?: string,
    orderBy?: string,
    orderType?: 'ASC' | 'DESC',
    bypassAccessControl: boolean = false,
  ): Promise<LayerSchema[] | { data: LayerSchema[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('layerSchema')
      .leftJoinAndSelect('layerSchema.colors', 'colors')
      .leftJoinAndSelect('layerSchema.layerGroup', 'layerGroup');

    // Filtro de busca por nome
    if (search) {
      queryBuilder.andWhere('layerSchema.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    if (!bypassAccessControl && !accessControl?.isAdminMaster()) {
      const userRoleIds = accessControl?.roles.map((role) => role.id) ?? [];
      queryBuilder.andWhere(
        '(layerSchema.isPublic = :isPublicTrue OR (layerSchema.isPublic = :isPublicFalse AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(COALESCE(layerSchema.allowedRoles, $$[]$$::jsonb)) AS role_id WHERE role_id IN (:...roles))))',
        {
          isPublicTrue: true,
          isPublicFalse: false,
          roles: userRoleIds.length > 0 ? userRoleIds : ['__no_role__'],
        },
      );
    }

    // Ordenação
    const effectiveOrderBy = orderBy
      ? `layerSchema.${orderBy}`
      : 'layerSchema.index';
    const effectiveOrderType = orderType ?? 'ASC';
    queryBuilder.orderBy(effectiveOrderBy, effectiveOrderType);

    // Se não houver orderBy específico, ordenar também por isActive secundário
    if (!orderBy) {
      queryBuilder.addOrderBy('layerSchema.isActive', 'DESC');
    }

    if (page && pageSize) {
      const take = pageSize;
      const skip = (page - 1) * pageSize;
      queryBuilder.take(take).skip(skip);
      const [data, total] = await queryBuilder.getManyAndCount();
      return { data, total };
    }

    const data = await queryBuilder.getMany();
    return data;
  }

  async findOne(
    id: string,
    accessControl?: AccessControl,
  ): Promise<LayerSchema> {
    let schema = await this.repository.findOne({
      where: { id },
      relations: ['colors'],
    });

    if (!schema) {
      const aliases: Record<string, string[]> = {
        lotes_fiscais: ['lotes', 'slui:lote_cidadao', 'lote_cidadao', 'lots'],
        lotes: ['lotes_fiscais', 'slui:lote_cidadao', 'lote_cidadao', 'lots'],
        'slui:lote_cidadao': ['lotes_fiscais', 'lotes', 'lote_cidadao', 'lots'],
      };
      const candidateIds = aliases[id] || [];
      for (const candidate of candidateIds) {
        schema = await this.repository.findOne({
          where: { id: candidate },
          relations: ['colors'],
        });
        if (schema) break;
      }
    }

    if (!schema) {
      throw new NotFoundException(`Layer schema with ID "${id}" not found`);
    }

    if (
      !accessControl?.isAdminMaster() &&
      !this.canViewLayer(schema, accessControl)
    ) {
      throw new NotFoundException(`Layer schema with ID "${id}" not found`);
    }

    return schema;
  }

  async create({
    id,
    name,
    origin,
    isActive,
    isSelected,
    includeInAnalysis,
    includeInFiu,
    type,
    isVisible,
    minZoom,
    getTextColorPropName,
    getFillColorPropName,
    getLineColorPropName,
    clickAction,
    viewTemplate,
    boardTemplate,
    properties,
    groupId,
    colors,
    index,
    isPublic,
    allowedRoles,
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
      isSelected,
      includeInAnalysis: includeInAnalysis ?? true,
      includeInFiu: includeInFiu ?? true,
      type,
      isVisible,
      minZoom,
      getTextColorPropName,
      getFillColorPropName,
      getLineColorPropName,
      clickAction,
      viewTemplate,
      boardTemplate,
      properties,
      groupId,
      layerGroup,
      colors,
      index,
      isPublic: isPublic ?? true,
      allowedRoles: allowedRoles ?? [],
    });

    return this.repository.save(entity);
  }

  async update(
    id: string,
    {
      name,
      origin,
      isActive,
      isSelected,
      includeInAnalysis,
      includeInFiu,
      type,
      isVisible,
      minZoom,
      getTextColorPropName,
      getFillColorPropName,
      getLineColorPropName,
      clickAction,
      viewTemplate,
      boardTemplate,
      properties,
      groupId,
      colors,
      index,
      isPublic,
      allowedRoles,

      ...dto
    }: LayerSchemaDto,
  ): Promise<LayerSchema> {
    const layerSchema = await this.repository.findOne({
      where: { id },
      relations: ['colors'],
    });
    if (!layerSchema) {
      throw new NotFoundException(`Layer schema with ID "${id}" not found`);
    }
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
    layerSchema.isSelected = isSelected;
    layerSchema.includeInAnalysis =
      includeInAnalysis ?? layerSchema.includeInAnalysis ?? true;
    layerSchema.includeInFiu = includeInFiu ?? layerSchema.includeInFiu ?? true;
    layerSchema.type = type;
    layerSchema.isVisible = isVisible;
    layerSchema.minZoom = minZoom;
    layerSchema.getTextColorPropName = getTextColorPropName;
    layerSchema.getFillColorPropName = getFillColorPropName;
    layerSchema.getLineColorPropName = getLineColorPropName;
    layerSchema.clickAction = clickAction;
    layerSchema.viewTemplate = viewTemplate;
    layerSchema.boardTemplate = boardTemplate;
    layerSchema.properties = properties;
    layerSchema.groupId = groupId;
    layerSchema.layerGroup = layerGroup;
    layerSchema.colors = colors;
    layerSchema.index = index;
    layerSchema.isPublic = isPublic ?? true;
    layerSchema.allowedRoles = allowedRoles ?? [];

    return await this.repository.save(layerSchema);
  }

  private canViewLayer(
    layer: LayerSchema,
    accessControl?: AccessControl,
  ): boolean {
    if (layer.isPublic === true) return true;

    const userRoleIds = new Set(
      accessControl?.roles.map((role) => role.id) ?? [],
    );
    return (layer.allowedRoles ?? []).some((roleId) => userRoleIds.has(roleId));
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async upsert(dto: LayerSchemaDto): Promise<LayerSchema> {
    const existing = await this.repository.findOneBy({ id: dto.id });

    return existing ? await this.update(dto.id, dto) : this.create(dto);
  }
}
