import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermission } from 'common/decorators/require-permissions/require-permissions.decorator';
import { AccessControlGuard } from 'common/guards/access-control/access-control.guard';
import { RolePermissionScopeEnum } from 'role/enums/role-permission-scope.enum';
import { DynamicSystemDataService } from './dynamic-system-data.service';
import 'multer';

@ApiTags('Dynamic System Data')
@Controller('dynamic-system-data')
export class DynamicSystemDataController {
  constructor(private readonly dynamicDataService: DynamicSystemDataService) {}

  @Post('import')
  @ApiBearerAuth()
  @UseGuards(AccessControlGuard)
  @RequirePermission({
    permissions: {
      resource: 'app-settings',
      action: 'update',
      scope: RolePermissionScopeEnum.ANY,
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import dynamic system data from Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Spreadsheet processed and saved successfully',
  })
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
  @ApiOperation({ summary: 'List all dynamic system data modules' })
  @ApiResponse({ status: 200, description: 'List of modules' })
  async listModules(@Query('version') version: string = '1.0') {
    const modules = await this.dynamicDataService.listModules(version);
    return {
      version,
      modules,
    };
  }

  @Get(':moduleName')
  @ApiOperation({ summary: 'Get dynamic system data for a specific module' })
  @ApiResponse({ status: 200, description: 'Module data' })
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
