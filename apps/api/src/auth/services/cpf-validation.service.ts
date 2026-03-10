import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class CpfValidationService {
  validate(cpf: string): Promise<boolean> {
    // Mocked validation against third-party system
    // In a real scenario, this would call an external API

    // For now, we consider all CPFs valid unless it's a specific test case
    if (cpf === '00000000000') {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            cpf: 'invalidExternal',
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return Promise.resolve(true);
  }
}
