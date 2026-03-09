import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';

function isCamelCase(str: string): boolean {
  return /^[a-z]+[a-zA-Z0-9]*$/.test(str) && !str.includes(' ');
}

function analyzeSheets() {
  const filePath = path.join(__dirname, '../src/files/Urbis - Variáveis de ambiente.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found at ${filePath}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(filePath);
  let report = `# Relatório de Estrutura da Planilha - Variáveis de Ambiente (Revisado)\n\n`;
  report += `**Total de Abas:** ${workbook.SheetNames.length}\n\n`;

  workbook.SheetNames.forEach((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];
    
    report += `## ${index + 1}. Aba: "${sheetName}"\n`;
    report += `- **Total de Linhas brutas:** ${data.length}\n`;
    
    if (data.length < 2) {
      report += `- **Aviso:** Aba vazia ou muito pequena.\n\n---\n\n`;
      return;
    }

    // Pega as primeiras linhas (ex: até a linha 3)
    const row0 = data[0] || [];
    const row1 = data.length > 1 ? data[1] : [];
    const row2 = data.length > 2 ? data[2] : [];

    // Lógica para detectar onde estão as chaves (keys).
    // Geralmente as keys são em camelCase, contêm letras minúsculas no início, não têm espaços.
    // Vamos contar quantos itens parecem "keys" na linha 0 e na linha 1
    
    let keyRowIndex = 0;
    const row0Camels = row0.filter(c => typeof c === 'string' && isCamelCase(c)).length;
    const row1Camels = row1.filter(c => typeof c === 'string' && isCamelCase(c)).length;

    // Se a linha 1 tiver muito mais "camelCases" ou "snake_case" sem espaços, ela é a linha de chaves.
    if (row1Camels > row0Camels) {
      keyRowIndex = 1;
    }

    // Em alguns casos, as keys estão na linha 1, mas o titulo pode estar acima vazio. 
    // Ou seja, se a linha 0 tem espaços e a linha 1 não, a linha 1 são as keys.
    const row0HasSpaces = row0.some(c => typeof c === 'string' && c.includes(' '));
    const row1HasSpaces = row1.some(c => typeof c === 'string' && c.includes(' '));

    if (row0HasSpaces && !row1HasSpaces && row1.filter(Boolean).length > 0) {
      keyRowIndex = 1;
    }

    const titleRow = keyRowIndex === 1 ? row0 : [];
    const keysRow = data[keyRowIndex] || [];
    const dataRowIndex = keyRowIndex + 1;
    const firstDataRow = data.length > dataRowIndex ? data[dataRowIndex] : [];

    // Limpar nulls das keys
    const keys = keysRow.map((k, i) => k || `__col_${i}__`).filter((k, i) => keysRow[i] !== null && keysRow[i] !== '');

    report += `- **Linha das Chaves (Keys):** Linha ${keyRowIndex + 1}\n`;
    if (keyRowIndex === 1) {
      report += `- **Títulos Humanos:** Linha 1 (Ex: ${titleRow.filter(Boolean).slice(0,3).join(', ')}...)\n`;
    }
    report += `- **Chaves Identificadas (${keys.length}):**\n  \`${keys.join('\`, \`')}\`\n`;
    
    if (firstDataRow && firstDataRow.length > 0) {
      // Pega apenas os valores que correspondem a colunas que têm chaves
      const firstDataFiltered = firstDataRow.filter((val, i) => keysRow[i] !== null && keysRow[i] !== '');
      report += `- **Exemplo de Dados (Linha ${dataRowIndex + 1}):**\n  > ${JSON.stringify(firstDataFiltered.slice(0, 5))} ...\n`;
    } else {
      report += `- **Exemplo de Dados:** Nenhum dado encontrado na linha ${dataRowIndex + 1}.\n`;
    }
    
    report += `\n---\n\n`;
  });

  const outPath = path.join(__dirname, 'excel-report-revised.md');
  fs.writeFileSync(outPath, report);
  console.log(`Relatório salvo em: ${outPath}`);
}

analyzeSheets();
