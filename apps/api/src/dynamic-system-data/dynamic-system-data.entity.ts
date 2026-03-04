import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('dynamic_system_data')
@Unique(['moduleName', 'version']) // Ensure only one active version of a module at a time
export class DynamicSystemData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_name', type: 'varchar', length: 255 })
  moduleName: string;

  @Column({ type: 'varchar', length: 50, default: '1.0' })
  version: string;

  @Column({ type: 'jsonb' })
  data: Record<string, any> | any[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
