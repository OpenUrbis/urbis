import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Role } from '../../../../role/entities/role.entity';
import { RoleTypeEnum } from '../../../../role/enums/role-type.enum';

@Injectable()
export class SystemRoleSeedService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  private async createSystemRole() {
    const roleId = '5e1ec786-0772-4735-966e-0229388433f1';
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (role) {
      role.isDefault = true;
      role.name = 'Usuário';
      role.type = RoleTypeEnum.SYSTEM;
      await this.roleRepository.save(role);
    } else {
      const newRole = this.roleRepository.create({
        id: roleId,
        name: 'Usuário',
        description: 'Cargo padrão para novos usuários',
        type: RoleTypeEnum.SYSTEM,
        isDefault: true,
      });
      await this.roleRepository.save(newRole);
    }

    await this.roleRepository.update(
        { id: Not(roleId), isDefault: true },
        { isDefault: false }
    );
  }

  run() {
    return this.createSystemRole();
  }
}
