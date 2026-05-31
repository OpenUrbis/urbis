export declare const BASE27_CHARS = "23456789BCDFGHJKLMNPQTVWXYZ";
/**
 * Expande uma string de coordenada para intervalo mínimo e máximo
 * @param {string} s - String da coordenada (ex: "-23.12345")
 * @returns {Array} Array com [min, max] do intervalo
 */
export declare function expandirPorTexto(s: string): [string, string];
/**
 * Converte número decimal para base27 usando caracteres específicos
 * @param {string | bigint} numeroDecimal - Número para conversão
 * @returns {string} String codificada em base27
 */
export declare function converterParaBase27(numeroDecimal: string | bigint): string;
/**
 * Converte código base27 para decimal
 * @param {string} codigoBase27 - Código em base27
 * @returns {string} String decimal de 10 dígitos
 */
export declare function converterDeBase27(codigoBase27: string): string;
/**
 * Extrai 5 primeiros decimais de um valor de coordenada
 * @param {number | string} valor - Valor da coordenada
 * @returns {string} 5 dígitos decimais
 */
export declare function extrair5Decimais(valor: number | string): string;
/**
 * Formata endereço digital com hífen
 * @param {string} endereco - Endereço sem formatação
 * @returns {string} Endereço formatado
 */
export declare function formatarEnderecoDigital(endereco: string): string;
/**
 * Remove formatação do endereço digital (hífen)
 * @param {string} endereco - Endereço formatado ou não
 * @returns {string} Endereço sem formatação
 */
export declare function desformatarEnderecoDigital(endereco: string): string;
/**
 * Codifica latitude e longitude para endereço digital
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} Endereço digital completo (prefixo + código)
 */
export declare function encode(lat: number, lon: number): string;
/**
 * Decodifica endereço digital para latitude e longitude
 * @param {string} digitalAddress - Endereço digital completo (ex: "-23-46 ABC-DEFG")
 * @returns {Object} Objeto com latitude e longitude aproximadas
 */
export declare function decode(digitalAddress: string): {
    latitude: number;
    longitude: number;
};
/**
 * Retorna os limites (polígono) do endereço digital
 * @param {string} digitalAddress
 * @returns {Array} Array de 4 pontos [lat, lon] representando o retângulo (inf-esq, inf-dir, sup-dir, sup-esq)
 */
export declare function getPolygon(digitalAddress: string): Array<{
    lat: number;
    lon: number;
}>;
/**
 * Calcula a distância entre dois pontos (latitude/longitude) em metros
 * @param lat1 Latitude do ponto 1
 * @param lng1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lng2 Longitude do ponto 2
 * @returns Distância em metros
 */
export declare function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
/**
 * Calcula a área aproximada de um polígono em metros quadrados
 * @param polygon Array de pontos {lat, lon}
 * @returns Área em m²
 */
export declare function calculateArea(polygon: Array<{
    lat: number;
    lon: number;
}>): number;
/**
 * Retorna métricas do endereço digital (comprimento das faces e área total)
 * @param digitalAddress Endereço digital
 * @returns Objeto com array de faces (metros) e área (metros quadrados)
 */
export declare function getAddressMetrics(digitalAddress: string): {
    faces: number[];
    area: number;
};
//# sourceMappingURL=index.d.ts.map