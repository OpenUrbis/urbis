import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharedMap } from './entities/shared-map.entity';
import { CreateSharedMapDto } from './dto/create-shared-map.dto';
import { UpdateSharedMapDto } from './dto/update-shared-map.dto';

@Injectable()
export class ShareService {
  constructor(
    @InjectRepository(SharedMap)
    private readonly sharedMapRepository: Repository<SharedMap>,
  ) {}

  async create(createSharedMapDto: CreateSharedMapDto): Promise<SharedMap> {
    const sharedMap = this.sharedMapRepository.create({
      ...createSharedMapDto,
      userId: 'mock-user-id-123', // Mocked user ID
    });
    return this.sharedMapRepository.save(sharedMap);
  }

  async findAllByUser(userId: string, page: number = 1, limit: number = 10): Promise<{ items: SharedMap[], total: number }> {
    const [items, total] = await this.sharedMapRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total };
  }

  async findOne(id: string): Promise<SharedMap> {
    const sharedMap = await this.sharedMapRepository.findOne({ where: { id } });
    if (!sharedMap) {
      throw new NotFoundException(`Shared map with ID ${id} not found`);
    }
    return sharedMap;
  }

  async update(id: string, updateSharedMapDto: UpdateSharedMapDto): Promise<SharedMap> {
    const sharedMap = await this.findOne(id);
    Object.assign(sharedMap, updateSharedMapDto);
    return this.sharedMapRepository.save(sharedMap);
  }
}
