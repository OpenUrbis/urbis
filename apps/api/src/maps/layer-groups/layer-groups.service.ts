import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { LayerGroupDto } from './dto/layer-group.dto';
import { LayerGroup } from './entities/layer-group.entity';

@Injectable()
export class LayerGroupsService {
  constructor(
    @InjectRepository(LayerGroup)
    private readonly repository: Repository<LayerGroup>,
  ) {}

  async findAll(
    page?: number,
    pageSize?: number,
    search?: string,
    orderBy?: string,
    orderType?: 'ASC' | 'DESC',
  ): Promise<LayerGroup[] | { data: LayerGroup[]; total: number }> {
    const where = search ? { name: ILike(`%${search}%`) } : {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order: any = orderBy ? { [orderBy]: orderType ?? 'ASC' } : { name: 'ASC' };

    if (page && pageSize) {
      const take = pageSize;
      const skip = (page - 1) * pageSize;
      const [data, total] = await this.repository.findAndCount({
        where,
        relations: ['parentGroup'],
        order,
        take,
        skip,
      });
      return { data, total };
    }
    return this.repository.find({ where, relations: ['parentGroup'], order });
  }

  async findOne(id: string): Promise<LayerGroup> {
    const group = await this.repository.findOneBy({ id });
    if (!group) {
      throw new NotFoundException(`Layer group with ID "${id}" not found`);
    }
    return group;
  }

  async checkOwnerGroup(ownerGroup: string) {
    if (!ownerGroup) return null;

    const group = await this.repository.findOneBy({ id: ownerGroup });
    if (!group)
      throw new NotFoundException(
        `Owner group with ID "${ownerGroup}" not found`,
      );

    return group;
  }

  async create({ id, name, ownerGroup }: LayerGroupDto): Promise<LayerGroup> {
    const another = await this.repository.findOneBy({ id: id });
    if (another)
      throw new BadRequestException(`Layer group with ID ${id} already exist`);
    const entity = this.repository.create({
      id,
      name,
      ownerGroup,
      parentGroup: await this.checkOwnerGroup(ownerGroup),
    });
    return this.repository.save(entity);
  }

  async update(
    id: string,
    { name, ownerGroup, ...dto }: LayerGroupDto,
  ): Promise<LayerGroup> {
    if (id !== dto.id) {
      const another = await this.repository.findOneBy({ id: dto.id });
      if (another)
        throw new BadRequestException(
          `Layer schema with ID ${dto.id} already exist`,
        );
    }
    await this.findOne(id);

    await this.repository.update(id, {
      id: dto.id,
      name,
      ownerGroup,
      parentGroup: await this.checkOwnerGroup(ownerGroup),
    });
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id);
    await this.repository.softDelete(id);
  }

  async upsert(dto: LayerGroupDto): Promise<LayerGroup> {
    const existing = await this.repository.findOneBy({ id: dto.id });

    return existing ? await this.update(dto.id, dto) : this.create(dto);
  }
}
