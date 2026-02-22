import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create(createProfileDto: CreateUserDto | User) {
    return this.usersRepository.save(
      this.usersRepository.create(createProfileDto),
    );
  }

  list() {
    return this.usersRepository.find();
  }

  findOne(
    fields: FindOptionsWhere<User>,
    findOptions: FindOneOptions<User> = {},
  ) {
    return this.usersRepository.findOne({
      ...findOptions,
      where: fields,
    });
  }

  get save() {
    return this.usersRepository.save.bind(this);
  }

  update(id: string, updateProfileDto: UpdateUserDto) {
    return this.usersRepository.update(
      { id },
      {
        id,
        ...updateProfileDto,
      },
    );
  }

  async softDelete(id: string): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  findByIdAndUpdate(id: string, updateDto: UpdateUserDto) {
    return this.usersRepository.update({ id }, updateDto);
  }
}
