import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayerGroup } from './entities/layer-group.entity';
import { LayerGroupDto } from './dto/layer-group.dto';

@Injectable()
export class LayerGroupsService {
  constructor(
    @InjectRepository(LayerGroup)
    private readonly repository: Repository<LayerGroup>,
  ) {}

  async findAll(): Promise<LayerGroup[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<LayerGroup> {
    const group = await this.repository.findOneBy({ id });
    if (!group) {
      throw new NotFoundException(`Layer group with ID "${id}" not found`);
    }
    return group;
  }

  async create(dto: LayerGroupDto): Promise<LayerGroup> {
    const entity = this.repository.create(dto);
    return this.repository.save(entity);
  }

  async update(id: string, dto: LayerGroupDto): Promise<LayerGroup> {
    await this.findOne(id); // Ensure the group exists
    await this.repository.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.findOne(id); // Ensure the group exists
    await this.repository.delete(id);
  }

  async upsert(dto: LayerGroupDto): Promise<LayerGroup> {
    const existing = await this.repository.findOneBy({ id: dto.id });
    if (existing) {
      await this.repository.update(dto.id, dto);
      return this.repository.findOneBy({ id: dto.id });
    } else {
      const entity = this.repository.create(dto);
      return this.repository.save(entity);
    }
  }
}
