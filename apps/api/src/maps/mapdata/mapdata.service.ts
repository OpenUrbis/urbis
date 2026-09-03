import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MapDataService {
  private readonly baseUrl = 'https://mapdata.urbis.prefeitura.sp.gov.br';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Helper to retrieve a token via Authentication/Token
   */
  async getAccessToken(): Promise<string> {
    try {
      // Padrão solicitado via payload FormData (isso poderia vir de env vars se fossem secrets reais)
      const formData = new FormData();
      formData.append('clientID', '123');
      formData.append('clientSecret', '456');

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/Authentication/Token`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        ),
      );

      // Assumindo que a resposta devolve { token: "..." }
      if (!response.data || !response.data.token) {
        throw new Error('Token not found in response');
      }

      return response.data.token;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to authenticate with MapData',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Envio do arquivo para processamento
   * @param id key of the uploaded S3 file
   */
  async requestFileProcessing(id: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      console.log(id);
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/File/${encodeURIComponent(id)}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      console.log('Error requesting file processing:', error);
      throw new HttpException(
        error.response?.data || 'Failed to request file processing',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Consulta status do processamento
   * @param id key of the uploaded S3 file
   */
  async checkFileProcessingStatus(id: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/File/${encodeURIComponent(id)}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to check file status',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Aprovação do arquivo
   * @param id key of the uploaded S3 file
   * @param payload key-value pairs representing block attributes
   */
  async approveFile(id: string, payload: Record<string, string>): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/Approve/${encodeURIComponent(id)}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to approve file',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Consulta status da aprovação
   * @param id key of the uploaded S3 file
   */
  async checkApprovalStatus(id: string): Promise<any> {
    try {
      const token = await this.getAccessToken();
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/Approve/${encodeURIComponent(id)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data || 'Failed to check approval status',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
