import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LayerSchema } from './entities/layer-schema.entity';
import { LayerSchemaDto } from './dto/layer-schema.dto';

@Injectable()
export class LayerSchemasService {
  constructor(
    @InjectRepository(LayerSchema)
    private readonly repository: Repository<LayerSchema>,
  ) {}

  async findAll(): Promise<LayerSchema[]> {
    return this.repository.find();
  }

  async findOne(id: string): Promise<LayerSchema> {
    return this.repository.findOneBy({ id });
  }

  async create(dto: LayerSchemaDto): Promise<LayerSchema> {
    const entity = this.repository.create(dto);
    return this.repository.save(entity);
  }

  async update(id: string, dto: LayerSchemaDto): Promise<LayerSchema> {
    await this.repository.update(id, dto);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async upsert(dto: LayerSchemaDto): Promise<LayerSchema> {
    const existing = await this.repository.findOneBy({ id: dto.id });
    if (existing) {
      // Update existing record
      await this.repository.update(dto.id, dto);
      return this.repository.findOneBy({ id: dto.id });
    } else {
      // Create new record
      const entity = this.repository.create(dto);
      return this.repository.save(entity);
    }
  }
}