import { ApiProperty } from '@nestjs/swagger';

export class TextLayerDtoResponse {
  @ApiProperty({ example: 'distrito-1234' })
  id: string;

  @ApiProperty({ example: [0, 0] })
  coordinates: [number, number];

  @ApiProperty({ example: { name: 'Distrito' } })
  properties: {
    [key: string]: any;
  };
}
