import { formatAttributeLabel } from "../components/FeaturesView/FeatureAttributesTable";

export interface ExportSpreadsheetOptions {
  title?: string;
  calculatedArea?: string | null;
  features: Array<{
    label: string;
    properties: Record<string, unknown>;
  }>;
}

export const exportAttributesToCsv = ({
  title = "Dados e Atributos da Geometria",
  calculatedArea,
  features,
}: ExportSpreadsheetOptions) => {
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR");

  const lines: string[] = [];

  // Metadata Header Block
  lines.push(`"RELATÓRIO DE INFORMAÇÕES URBANÍSTICAS E ATRIBUTOS - URBIS"`);
  lines.push(`"Identificação / Título";"${title.replace(/"/g, '""')}"`);
  lines.push(`"Data da Consulta";"${dateFormatted}"`);
  if (calculatedArea) {
    lines.push(`"Área da Geometria";"${calculatedArea}"`);
  }
  lines.push(`"Fonte";"Prefeitura de São Paulo / Urbis"`);
  lines.push("");

  // Column headers
  lines.push(`"Camada";"Parâmetro / Atributo";"Código do Campo";"Valor"`);

  features.forEach((feat) => {
    const layerName = feat.label;
    const props = feat.properties || {};

    Object.entries(props).forEach(([key, rawValue]) => {
      if (key === "geometry" || key === "coordinates" || key === "type" || key.startsWith("__")) {
        return;
      }

      const label = formatAttributeLabel(key);
      let valueStr = "";

      if (rawValue === null || rawValue === undefined) {
        valueStr = "—";
      } else if (typeof rawValue === "boolean") {
        valueStr = rawValue ? "Sim" : "Não";
      } else if (typeof rawValue === "number") {
        valueStr = rawValue.toLocaleString("pt-BR");
      } else if (typeof rawValue === "object") {
        valueStr = JSON.stringify(rawValue);
      } else {
        valueStr = String(rawValue).trim();
      }

      lines.push(
        `"${layerName.replace(/"/g, '""')}";"${label.replace(/"/g, '""')}";"${key.replace(/"/g, '""')}";"${valueStr.replace(/"/g, '""')}"`
      );
    });
  });

  // UTF-8 BOM for Microsoft Excel / Google Sheets compatibility
  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const cleanFilename = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "urbis_atributos";

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${cleanFilename}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
