import { ApiProperty } from '@nestjs/swagger';
import { LayerGroup } from 'layer-groups/entities/layer-group.entity';
import { LayerSchema } from 'layer-schemas/entities/layer-schema.entity';

export class MapConfigResponseDto {
  @ApiProperty({ description: '', example: -23.5505 })
  latitude: number;

  @ApiProperty({ description: '', example: -46.6333 })
  longitude: number;

  @ApiProperty({
    description: '',
    example: [
      -47.276872262413406, -24.206465289774574, -46.05576004987694,
      -23.087911153581274,
    ],
  })
  boundingBox: [number, number, number, number];

  @ApiProperty({ description: '', example: 10 })
  zoom: number;

  @ApiProperty({ description: '', example: -45 })
  bearing: number;

  @ApiProperty({ description: '', example: 0 })
  pitch: number;

  @ApiProperty({
    description: '',
    example: { top: 0, bottom: 150, left: 280, right: 0 },
  })
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };

  @ApiProperty({ description: '', example: [LayerGroup] })
  layerGroups: [LayerGroup];

  @ApiProperty({ description: '', example: [LayerSchema] })
  layerSchemas: [LayerSchema];
}
