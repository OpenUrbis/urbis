import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';

export enum MapConfigType {
  LITERAL_NUMBER = 'literal-number',
  LITERAL_STRING = 'literal-string',
  ARRAY = 'array',
  OBJECT = 'object',
  VIEW_TEMPLATE = 'view-template',
}

@Entity('map_config')
export class MapConfig {
  @ApiProperty({
    example: 'zoom',
    description: 'Unique identifier for the map config',
  })
  @PrimaryColumn()
  id: string;

  @ApiProperty({
    example: MapConfigType.LITERAL_NUMBER,
    required: true,
    enum: MapConfigType,
    description: 'Tipo do valor da configuração para renderização e validação',
  })
  @Column({
    nullable: false,
    type: 'enum',
    enum: MapConfigType,
    enumName: 'map_config_type_enum',
    default: MapConfigType.OBJECT,
  })
  type: MapConfigType;

  @ApiProperty({
    example: 'Nível de zoom inicial do mapa',
    required: true,
    description: 'Descrição funcional da configuração do mapa',
  })
  @Column({ nullable: false, type: 'text', default: '' })
  description: string;

  @ApiProperty({
    example: '10',
    required: true,
    description: 'Value for the param of the map',
  })
  @Column({ nullable: false, type: 'jsonb' })
  value: unknown;
}
