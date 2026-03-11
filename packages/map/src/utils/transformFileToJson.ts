// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformFileToJson(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    // Verifica se o arquivo é um GeoJSON
    if (file && file.type === "application/geo+json") {
      const reader = new FileReader();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      reader.onload = function (event: any) {
        try {
          // O conteúdo do arquivo é acessível através de event.target.result
          const geojsonContent = JSON.parse(event.target.result as string);

          // Retorna o conteúdo do GeoJSON
          resolve(geojsonContent);
        } catch (error) {
          reject("Erro ao ler o GeoJSON: " + error);
        }
      };

      reader.onerror = function (error) {
        reject("Erro ao ler o arquivo: " + error);
      };

      // Lê o conteúdo do arquivo como texto
      reader.readAsText(file);
    } else {
      reject("O arquivo não é um GeoJSON válido.");
    }
  });
}
