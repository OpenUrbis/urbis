import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as xlsx from 'xlsx';
import { DynamicSystemData } from './dynamic-system-data.entity';

@Injectable()
export class DynamicSystemDataService {
  constructor(
    @InjectRepository(DynamicSystemData)
    private readonly dynamicDataRepo: Repository<DynamicSystemData>,
  ) {}

  async processExcelFile(
    buffer: Buffer,
    version: string = '1.0',
  ): Promise<any> {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const rawData: Record<string, any[]> = {};

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const rawRows = xlsx.utils.sheet_to_json<any[]>(sheet, {
          header: 1,
          defval: null,
        });

        if (rawRows.length < 2) {
          rawData[sheetName] = [];
          return;
        }

        const row0 = rawRows[0] || [];
        const row1 = rawRows[1] || [];

        const isCamelCase = (str: string) =>
          /^[a-z]+[a-zA-Z0-9]*$/.test(str) && !str.includes(' ');
        const row0Camels = row0.filter(
          (c) => typeof c === 'string' && isCamelCase(c),
        ).length;
        const row1Camels = row1.filter(
          (c) => typeof c === 'string' && isCamelCase(c),
        ).length;

        let keyRowIndex = 0;
        if (row1Camels > row0Camels) {
          keyRowIndex = 1;
        }

        const row0HasSpaces = row0.some(
          (c) => typeof c === 'string' && c.includes(' '),
        );
        const row1HasSpaces = row1.some(
          (c) => typeof c === 'string' && c.includes(' '),
        );
        if (
          row0HasSpaces &&
          !row1HasSpaces &&
          row1.filter(Boolean).length > 0
        ) {
          keyRowIndex = 1;
        }

        if (sheetName === 'Usos permitidos por Zona') {
          keyRowIndex = 0;
        }

        const keysRow = rawRows[keyRowIndex] || [];
        const keys = keysRow.map((k, i) => k || `__col_${i}__`);

        const parsedData = [];
        for (let i = keyRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;

          const obj: Record<string, any> = {};
          let hasData = false;

          keys.forEach((key, colIndex) => {
            if (keysRow[colIndex] !== null && keysRow[colIndex] !== '') {
              obj[key] = row[colIndex];
              if (row[colIndex] !== null && row[colIndex] !== '')
                hasData = true;
            }
          });

          if (hasData) parsedData.push(obj);
        }

        rawData[sheetName] = parsedData;
      });

      // Save to database
      const savedModules = [];
      for (const [sheetName, data] of Object.entries(rawData)) {
        // Find existing to update or create new
        let record = await this.dynamicDataRepo.findOne({
          where: { moduleName: sheetName, version },
        });

        if (!record) {
          record = this.dynamicDataRepo.create({
            moduleName: sheetName,
            version,
            isActive: true,
          });
        }

        record.data = data;
        record.isActive = true;

        await this.dynamicDataRepo.save(record);
        savedModules.push(sheetName);
      }

      return {
        importedModules: savedModules,
        version,
      };
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao processar arquivo: ${error.message}`,
      );
    }
  }

  async getModuleData(
    moduleName: string,
    version: string = '1.0',
  ): Promise<any> {
    const record = await this.dynamicDataRepo.findOne({
      where: { moduleName, version, isActive: true },
    });

    if (!record) {
      throw new NotFoundException(
        `Módulo '${moduleName}' (v${version}) não encontrado ou inativo.`,
      );
    }

    return record.data;
  }

  async listModules(version: string = '1.0'): Promise<string[]> {
    const records = await this.dynamicDataRepo.find({
      where: { version, isActive: true },
      select: ['moduleName'],
    });

    return records.map((r) => r.moduleName);
  }
}
