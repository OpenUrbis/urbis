import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('map_config')
export class MapConfig {
  @ApiProperty({
    example: 'zoom',
    description: 'Unique identifier for the map config',
  })
  @PrimaryColumn()
  id: string;

  @ApiProperty({
    example: '10',
    required: true,
    description: 'Value for the param of the map',
  })
  @Column({ nullable: false, type: 'jsonb' })
  value: any;
}
