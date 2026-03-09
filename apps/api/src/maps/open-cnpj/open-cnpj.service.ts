import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AxiosError } from 'axios';

@Injectable()
export class OpenCnpjService {
  private readonly logger = new Logger(OpenCnpjService.name);
  private readonly baseUrl = 'https://api.opencnpj.org';

  constructor(private readonly httpService: HttpService) {}

  async getCnpjData(cnpj: string): Promise<any> {
    const url = `${this.baseUrl}/${encodeURIComponent(cnpj)}`;

    this.logger.log(`Fetching CNPJ data for: ${cnpj}`);

    const { data } = await firstValueFrom(
      this.httpService.get(url).pipe(
        catchError((error: AxiosError) => {
          if (error.response) {
            this.logger.error(
              `OpenCNPJ API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
            );
            throw new HttpException(
              error.response.data || 'Error fetching CNPJ data',
              error.response.status,
            );
          }
          this.logger.error(`OpenCNPJ API network error: ${error.message}`);
          throw new HttpException(
            'Failed to connect to OpenCNPJ API',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      ),
    );

    return data;
  }
}
