// Conjunto de caracteres válidos para codificação base27
export const BASE27_CHARS = '23456789BCDFGHJKLMNPQTVWXYZ';

/**
 * Expande uma string de coordenada para intervalo mínimo e máximo
 * @param {string} s - String da coordenada (ex: "-23.12345")
 * @returns {Array} Array com [min, max] do intervalo
 */
export function expandirPorTexto(s: string): [string, string] {
  s = s.trim();
  let base: string;
  let dec: string;
  
  if (s.includes(".")) {
    [base, dec] = s.split(".", 2);
    
    // Trunca para 8 casas decimais se necessário
    if (dec.length > 8) {
      dec = dec.substring(0, 8);
      return [base + "." + dec, base + "." + dec];
    } else {
      // Expande para intervalo com zeros e noves
      const decMin = dec.padEnd(8, "0");
      const decMax = dec + "9".repeat(8 - dec.length);
      return [base + "." + decMin, base + "." + decMax];
    }
  } else {
    base = s;
    return [base + ".00000000", base + ".99999999"];
  }
}

/**
 * Converte número decimal para base27 usando caracteres específicos
 * @param {string | bigint} numeroDecimal - Número para conversão
 * @returns {string} String codificada em base27
 */
export function converterParaBase27(numeroDecimal: string | bigint): string {
  let resultado = '';
  let numero = BigInt(numeroDecimal);
  const base = BigInt(27);
  
  if (numero === 0n) {
    return BASE27_CHARS[0].repeat(7);
  }
  
  while (numero > 0n) {
    const resto = Number(numero % base);
    resultado = BASE27_CHARS[resto] + resultado;
    numero = numero / base;
  }
  
  while (resultado.length < 7) {
    resultado = BASE27_CHARS[0] + resultado;
  }
  
  return resultado;
}

/**
 * Converte código base27 para decimal
 * @param {string} codigoBase27 - Código em base27
 * @returns {string} String decimal de 10 dígitos
 */
export function converterDeBase27(codigoBase27: string): string {
  let resultado = 0n;
  const base = BigInt(27);
  
  for (let i = 0; i < codigoBase27.length; i++) {
    const char = codigoBase27[i];
    const index = BASE27_CHARS.indexOf(char);
    if (index === -1) {
        throw new Error(`Invalid character in base27 code: ${char}`);
    }
    const valor = BigInt(index);
    resultado = resultado * base + valor;
  }
  
  return resultado.toString().padStart(10, '0');
}

/**
 * Extrai 5 primeiros decimais de um valor de coordenada
 * @param {number | string} valor - Valor da coordenada
 * @returns {string} 5 dígitos decimais
 */
export function extrair5Decimais(valor: number | string): string {
  let partes = valor.toString().split('.');
  if (partes.length === 1) {
    return '00000';
  }
  
  let decimais = partes[1];
  if (decimais.length > 5) {
    decimais = decimais.substring(0, 5);
  } else {
    decimais = decimais.padEnd(5, '0');
  }
  
  return decimais;
}

/**
 * Formata endereço digital com hífen
 * @param {string} endereco - Endereço sem formatação
 * @returns {string} Endereço formatado
 */
export function formatarEnderecoDigital(endereco: string): string {
  if (endereco.length === 7) {
    return endereco.substring(0, 3) + '-' + endereco.substring(3);
  }
  return endereco;
}

/**
 * Remove formatação do endereço digital (hífen)
 * @param {string} endereco - Endereço formatado ou não
 * @returns {string} Endereço sem formatação
 */
export function desformatarEnderecoDigital(endereco: string): string {
    return endereco.replace(/-/g, '');
}

/**
 * Codifica latitude e longitude para endereço digital
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} Endereço digital completo (prefixo + código)
 */
export function encode(lat: number, lon: number): string {
  const latInt = (lat < 0 ? "-" : "+") + Math.abs(Math.trunc(lat));
  const lonInt = (lon < 0 ? "-" : "+") + Math.abs(Math.trunc(lon));
  const prefixo = latInt + lonInt;

  const lat5 = extrair5Decimais(lat);
  const lon5 = extrair5Decimais(lon);
  const cincoMais5 = lat5 + lon5;
  
  const numeroDecimal = BigInt(cincoMais5);
  const endereco = converterParaBase27(numeroDecimal);
  const enderecoFormatado = formatarEnderecoDigital(endereco);
  
  return `${prefixo} ${enderecoFormatado}`;
}

function parseDigitalAddress(digitalAddress: string): { latStr: string, lonStr: string } {
    const cleanInput = digitalAddress.trim();
    
    // Try to split by space to separate prefix and code
    const parts = cleanInput.split(/\s+/);
    let prefixPart = "";
    let codePart = "";
    let foundCode = "";

    if (parts.length >= 2) {
        // Assume last part is code, rest is prefix
        codePart = parts[parts.length - 1];
        prefixPart = parts.slice(0, parts.length - 1).join(" ");
        
        // Extract valid chars from codePart
        for (let i = 0; i < codePart.length; i++) {
             const char = codePart[i].toUpperCase();
             if (BASE27_CHARS.includes(char)) {
                 foundCode += char;
             }
        }
    } else {
        // Fallback to right-to-left scan
        // Find valid base27 chars from right to left (expecting 7)
        let codeStartIndex = -1;
        let charsFound = 0;
        
        for (let i = cleanInput.length - 1; i >= 0; i--) {
            const char = cleanInput[i].toUpperCase();
            if (BASE27_CHARS.includes(char)) {
                foundCode = char + foundCode;
                charsFound++;
                codeStartIndex = i;
            }
            if (charsFound === 7) break;
        }
        
        if (codeStartIndex !== -1) {
            prefixPart = cleanInput.substring(0, codeStartIndex).trim();
        }
    }
    
    if (foundCode.length < 7) {
        throw new Error("Invalid digital address: incomplete code");
    }
    
    // Decode code
    const decimalStr = converterDeBase27(foundCode);
    const latDecimais = decimalStr.substring(0, 5);
    const lonDecimais = decimalStr.substring(5, 10);
    
    // Parse prefix
    // Expecting [+-]lat[+-]lon
    // We clean up the prefix part to match regex
    const cleanPrefix = prefixPart.replace(/[^0-9+-]/g, '');
    const prefixRegex = /^([+-])(\d{1,2})([+-])(\d{1,3})$/;
    const match = cleanPrefix.match(prefixRegex);
    
    if (!match) {
        throw new Error("Invalid digital address: invalid prefix format");
    }
    
    const latSign = match[1];
    const latInt = match[2];
    const lonSign = match[3];
    const lonInt = match[4];
    
    const latStr = `${latSign}${latInt}.${latDecimais}`;
    const lonStr = `${lonSign}${lonInt}.${lonDecimais}`;

    return { latStr, lonStr };
}

/**
 * Decodifica endereço digital para latitude e longitude
 * @param {string} digitalAddress - Endereço digital completo (ex: "-23-46 ABC-DEFG")
 * @returns {Object} Objeto com latitude e longitude aproximadas
 */
export function decode(digitalAddress: string): { latitude: number, longitude: number } {
    const { latStr, lonStr } = parseDigitalAddress(digitalAddress);
    
    return {
        latitude: parseFloat(latStr),
        longitude: parseFloat(lonStr)
    };
}

/**
 * Retorna os limites (polígono) do endereço digital
 * @param {string} digitalAddress
 * @returns {Array} Array de 4 pontos [lat, lon] representando o retângulo (inf-esq, inf-dir, sup-dir, sup-esq)
 */
export function getPolygon(digitalAddress: string): Array<{lat: number, lon: number}> {
    const { latStr, lonStr } = parseDigitalAddress(digitalAddress);
    const [latMin, latMax] = expandirPorTexto(latStr);
    const [lonMin, lonMax] = expandirPorTexto(lonStr);
    
    return [
        { lat: parseFloat(latMin), lon: parseFloat(lonMin) },
        { lat: parseFloat(latMin), lon: parseFloat(lonMax) },
        { lat: parseFloat(latMax), lon: parseFloat(lonMax) },
        { lat: parseFloat(latMax), lon: parseFloat(lonMin) }
    ];
}

/**
 * Calcula a distância entre dois pontos (latitude/longitude) em metros
 * @param lat1 Latitude do ponto 1
 * @param lng1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lng2 Longitude do ponto 2
 * @returns Distância em metros
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Calcula a área aproximada de um polígono em metros quadrados
 * @param polygon Array de pontos {lat, lon}
 * @returns Área em m²
 */
export function calculateArea(polygon: Array<{lat: number, lon: number}>): number {
    let area = 0;
    const points = polygon.map(p => [p.lat, p.lon]);
    
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        area += points[i][1] * points[j][0];
        area -= points[j][1] * points[i][0];
    }
    
    // Conversão de graus quadrados para metros quadrados
    area = Math.abs(area) * 111319.488 * 111319.488 / 2;
    return area;
}

/**
 * Retorna métricas do endereço digital (comprimento das faces e área total)
 * @param digitalAddress Endereço digital
 * @returns Objeto com array de faces (metros) e área (metros quadrados)
 */
export function getAddressMetrics(digitalAddress: string): { faces: number[], area: number } {
    const polygon = getPolygon(digitalAddress);
    
    const faces = [
        calculateDistance(polygon[0].lat, polygon[0].lon, polygon[1].lat, polygon[1].lon),
        calculateDistance(polygon[1].lat, polygon[1].lon, polygon[2].lat, polygon[2].lon),
        calculateDistance(polygon[2].lat, polygon[2].lon, polygon[3].lat, polygon[3].lon),
        calculateDistance(polygon[3].lat, polygon[3].lon, polygon[0].lat, polygon[0].lon)
    ];
    
    const area = calculateArea(polygon);
    
    return { faces, area };
}
