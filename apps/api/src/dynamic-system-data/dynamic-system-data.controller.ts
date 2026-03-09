import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DynamicSystemDataService } from './dynamic-system-data.service';
import 'multer';

@Controller('dynamic-system-data')
export class DynamicSystemDataController {
  constructor(private readonly dynamicDataService: DynamicSystemDataService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: any,
    @Query('version') version: string = '1.0',
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const isExcelMimeType =
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/octet-stream'; // Allowing curl uploads occasionally

    const isExcelExtension = file.originalname?.match(/\.(xlsx|xls)$/i);

    if (!isExcelMimeType && !isExcelExtension) {
      throw new BadRequestException(
        `Arquivo inválido. Envie uma planilha Excel (.xlsx ou .xls) - Recebido: ${file.mimetype}`,
      );
    }

    try {
      const result = await this.dynamicDataService.processExcelFile(
        file.buffer,
        version,
      );
      return {
        message: 'Planilha processada e salva com sucesso',
        data: result,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao processar a planilha: ${error.message}`,
      );
    }
  }

  @Get()
  async listModules(@Query('version') version: string = '1.0') {
    const modules = await this.dynamicDataService.listModules(version);
    return {
      version,
      modules,
    };
  }

  @Get(':moduleName')
  async getModuleData(
    @Param('moduleName') moduleName: string,
    @Query('version') version: string = '1.0',
  ) {
    const data = await this.dynamicDataService.getModuleData(
      moduleName,
      version,
    );
    return {
      moduleName,
      version,
      data,
    };
  }
}
