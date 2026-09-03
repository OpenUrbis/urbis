import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async create(
    createSharedMapDto: CreateSharedMapDto,
    userId: string,
  ): Promise<SharedMap> {
    const sharedMap = this.sharedMapRepository.create({
      ...createSharedMapDto,
      userId,
    });
    return this.sharedMapRepository.save(sharedMap);
  }

  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
    type: string = 'map',
  ): Promise<{ items: SharedMap[]; total: number }> {
    const query = this.sharedMapRepository
      .createQueryBuilder('share')
      .where('share.userId = :userId', { userId });

    if (type === 'map') {
      query.andWhere('(share.type = :type OR share.type IS NULL)', {
        type: 'map',
      });
    } else {
      query.andWhere('share.type = :type', { type });
    }

    const [items, total] = await query
      .orderBy('share.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findAllPublic(
    page: number = 1,
    limit: number = 10,
    type: string = 'map',
  ): Promise<{ items: SharedMap[]; total: number }> {
    const query = this.sharedMapRepository
      .createQueryBuilder('share')
      .where('share.isPublic = :isPublic', { isPublic: true });

    if (type === 'map') {
      query.andWhere('(share.type = :type OR share.type IS NULL)', {
        type: 'map',
      });
    } else {
      query.andWhere('share.type = :type', { type });
    }

    const [items, total] = await query
      .orderBy('share.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total };
  }

  async findOne(id: string): Promise<SharedMap> {
    const sharedMap = await this.sharedMapRepository.findOne({ where: { id } });
    if (!sharedMap) {
      throw new NotFoundException(`Shared map with ID ${id} not found`);
    }
    return sharedMap;
  }

  async update(
    id: string,
    updateSharedMapDto: UpdateSharedMapDto,
    userId: string,
  ): Promise<SharedMap> {
    const sharedMap = await this.findOne(id);

    if (sharedMap.userId !== userId) {
      throw new Error('You do not have permission to update this shared map');
    }

    Object.assign(sharedMap, updateSharedMapDto);
    return this.sharedMapRepository.save(sharedMap);
  }

  async remove(id: string, userId: string): Promise<void> {
    const sharedMap = await this.findOne(id);

    if (sharedMap.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this shared map',
      );
    }

    await this.sharedMapRepository.delete(id);
  }
}
