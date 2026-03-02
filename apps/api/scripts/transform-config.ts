import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

const BaseLegalSchema = z.string().min(1, { message: "Base legal is required" });

const ZonaSchema = z.object({
  nome: z.string().optional(),
  abreviacao: z.string().optional(),
  bea: z.boolean().optional(),
});

const ParametroZonaSchema = z.object({
  frenteMinimaLote: z.union([z.string(), z.number()]).nullable(),
  areaMinimaLote: z.union([z.string(), z.number()]).nullable(),
  coefAproveitamentoBasico: z.union([z.string(), z.number()]).nullable(),
  coefAproveitamentoMaximo: z.union([z.string(), z.number()]).nullable(),
  taxaOcupacaoMaxima500: z.union([z.string(), z.number()]).nullable(),
  gabaritoAlturaMaxima: z.union([z.string(), z.number()]).nullable(),
  recuoFrente: z.union([z.string(), z.number()]).nullable(),
});

const ConfigSchema = z.object({
  versao: z.string(),
  dataAtualizacao: z.string().optional(),
  zonas: z.array(ZonaSchema),
  parametrosPorZona: z.record(z.string(), ParametroZonaSchema.partial().passthrough()),
  areasEspeciais: z.object({
    aiu: z.array(z.object({
      nome: z.string().optional(),
      bea: z.boolean().optional(),
      baseLegal: z.string().optional(),
    }).passthrough()),
  }).passthrough(),
  // Can add more specific schemas later
}).passthrough();

function transformConfig() {
  const rawPath = path.join(__dirname, '../src/config/urbanismo.config.raw.json');
  
  if (!fs.existsSync(rawPath)) {
    console.error(`Raw config not found at ${rawPath}`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

  // Very basic extraction, would need specific sheet names mapped
  const configTransformado: any = {
    versao: new Date().toISOString().slice(0, 7), // YYYY-MM
    dataAtualizacao: new Date().toISOString().slice(0, 10),
    zonas: [],
    parametrosPorZona: {},
    areasEspeciais: {
      aiu: []
    }
  };

  // Add the entire rawData as a backup/passthrough while developing
  configTransformado.raw_data = rawData;

  // Attempt to parse/extract known fields
  const zonasSheet = rawData['Zonas'];
  if (zonasSheet && Array.isArray(zonasSheet)) {
    configTransformado.zonas = zonasSheet.map(row => ({
      nome: row['ZONA_NOME'] || row['nome'] || row['ZONA'] || Object.values(row)[0],
      abreviacao: row['ZONA_ABREVIACAO'] || row['abreviacao'] || row['SIGLA'] || Object.values(row)[1],
      bea: row['BEA'] === 'SIM' || row['BEA'] === true,
      ...row // keep other raw properties
    }));
  }

  // Attempt to extract AIU
  const aiuSheet = rawData['Áreas de Intervenção Urbana'];
  if (aiuSheet && Array.isArray(aiuSheet)) {
    // Skipping headers might be needed depending on the structure
    configTransformado.areasEspeciais.aiu = aiuSheet.map(row => ({
      nome: row['NOME'] || Object.values(row)[0],
      bea: row['BEA'] === 'SIM' || row['BEA'] === true,
      baseLegal: row['BASE_LEGAL'] || row['LEI'] || Object.values(row)[2],
      ...row
    }));
  }

  try {
    ConfigSchema.parse(configTransformado);
  } catch (err) {
    console.error("Validation error:", err);
  }

  const outPath = path.join(__dirname, '../src/config/urbanismo.config.ts');
  const fileContent = `export const URBANISMO_CONFIG = ${JSON.stringify(configTransformado, null, 2)} as const;`;
  
  fs.writeFileSync(outPath, fileContent);
  console.log(`Structured config written to ${outPath}`);
}

transformConfig();
