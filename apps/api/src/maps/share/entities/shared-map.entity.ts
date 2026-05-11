import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('shared_maps')
export class SharedMap {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column()
  @ApiProperty()
  name: string;

  @Column({ nullable: true })
  @ApiProperty()
  description: string;

  @Column()
  @ApiProperty()
  userId: string;

  @Column({ type: 'jsonb' })
  @ApiProperty()
  state: any;

  @Column({ default: false })
  @ApiProperty()
  isPublic: boolean;

  @Column({ nullable: true })
  @ApiProperty()
  type: string;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;
}
