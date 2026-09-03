import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';

function extractExcel() {
  const filePath = path.join(
    __dirname,
    '../src/files/Urbis - Variáveis de ambiente.xlsx',
  );

  if (!fs.existsSync(filePath)) {
    console.error(`File not found at ${filePath}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(filePath);
  const rawData: Record<string, any[]> = {};

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    // Convert to JSON. Use header: 1 to get an array of arrays
    // Or default header to get an array of objects based on the first row
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });
    rawData[sheetName] = data;
  });

  const outPath = path.join(
    __dirname,
    '../src/config/urbanismo.config.raw.json',
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(rawData, null, 2));

  console.log(`Extracted ${workbook.SheetNames.length} sheets to ${outPath}`);
}

extractExcel();
