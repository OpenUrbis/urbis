import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString } from 'class-validator';

export class UpdateMapConfigDto {
  @ApiProperty({
    example: 'Nível de zoom inicial do mapa',
    description: 'Descrição funcional da configuração do mapa',
  })
  @IsString()
  description: string;

  @ApiProperty({
    example: { literally: 10 },
    description: 'Valor JSON da configuração do mapa',
  })
  @IsDefined()
  value: unknown;
}
