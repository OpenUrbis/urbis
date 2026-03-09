// packages/map/src/components/MapDataIntegrationField/utils/dwg-unwrap.ts

/**
 * Utilitário agressivo para desempacotar dados vindos de Proxies (Preact Signals).
 * Isso evita loops infinitos e erros de acesso a propriedades internas do Preact.
 */
export function unwrapDwgData(data: any): any {
  if (!data) return null;
  
  try {
    // A forma mais segura de quebrar a reatividade em objetos complexos
    // é através da serialização e desserialização completa.
    return JSON.parse(JSON.stringify(data));
  } catch (e) {
    console.warn("Falha no unwrap via JSON, tentando recursão manual simples:", e);
    return manualUnwrap(data);
  }
}

function manualUnwrap(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(manualUnwrap);
  
  const result: any = {};
  for (const key in obj) {
    // Ignora propriedades internas do Preact
    if (key.startsWith('__')) continue;
    result[key] = manualUnwrap(obj[key]);
  }
  return result;
}
