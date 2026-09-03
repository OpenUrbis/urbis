/**
 * Normalizes legacy URLs (e.g. *.sampa.br, mapa.urbis.sampa.br) to official Urbis domains.
 */
export function normalizeLegisUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";

  return url
    .replace(/\bmapa\.urbis\.sampa\.br\b/gi, "mapa.urbis.prefeitura.sp.gov.br")
    .replace(/\bdatalake\.urbis\.(?:sampa\.br|prefeitura\.sp\.gov\.br)\b/gi, "dadosabertos.urbis.prefeitura.sp.gov.br")
    .replace(/\burbis\.sampa\.br\b/gi, "dadosabertos.urbis.prefeitura.sp.gov.br")
    .replace(/\b([a-z0-9-]+)\.sampa\.br\b/gi, "$1.prefeitura.sp.gov.br");
}
