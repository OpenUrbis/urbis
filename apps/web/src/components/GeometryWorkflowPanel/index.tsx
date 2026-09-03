import { useState } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { Button, Input, UrbisIcon } from "@open-urbis/map-ui";
import {
  SquareMousePointer,
  UploadCloud,
  PenTool,
  SlidersHorizontal,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import proj4 from "proj4";
import { useMapContext } from "../../hooks/useMapContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { transformFileToJson } from "../../utils/transformFileToJson";
import { getGeoJsonBounds } from "../MapView/utils";
import { ProspectiveSearchPage } from "../../pages/Map/ProspectiveSearchPage";

export const GeometryWorkflowPanel = ({
  title = "Ficha de Informações Urbanísticas - FIU",
  description = "Obtenha de forma integrada dados urbanísticos úteis para empreender em qualquer parte da cidade.",
}: {
  title?: string;
  description?: string;
}) => {
  const file = useSignal<File | null>(null);
  const crs = useSignal<"EPSG:4674" | "EPSG:4326" | "EPSG:31983">("EPSG:31983");
  const error = useSignal("");
  const polygonEdit = usePolygonEditContext();
  const { flyTo, isPickingLocation, onLocationPick } = useMapContext();
  const { toggleDrawer: _toggleDrawer, clearCurrentPage, navigateTo } = useNavigationContext();

  const [expandedOption, setExpandedOption] = useState<"select" | "upload" | "draw" | null>("select");

  const handleStartPolygonSelection = () => {
    isPickingLocation.value = true;
    onLocationPick.value = (lat, lon) => {
      window.dispatchEvent(
        new CustomEvent("inspect-map-attributes", {
          detail: { latitude: lat, longitude: lon },
        })
      );
    };
    clearCurrentPage();
  };

  const startDrawing = () => {
    polygonEdit.reset();
    polygonEdit.setIsEditing(true);
    polygonEdit.drawRef.current?.deleteAll();
    polygonEdit.drawRef.current?.changeMode("draw_polygon");
    clearCurrentPage();
  };

  const selectedExample =
    crs.value === "EPSG:31983"
      ? {
          href: "/exemplo_sirgas_utm.geojson",
          label: "Baixar exemplo neste formato",
        }
      : {
          href: "/exemplo_wgs84.geojson",
          label: "Baixar exemplo neste formato",
        };

  const handleImport = async () => {
    if (!file.value) {
      error.value = "Selecione um arquivo GeoJSON válido.";
      return;
    }

    try {
      let object = await transformFileToJson(file.value);

      if (crs.value !== "EPSG:4326") {
        const transform = (coords: any): any => {
          if (typeof coords[0] === "number") {
            return proj4(crs.value, "EPSG:4326", coords);
          }
          return coords.map(transform);
        };

        const transformFeature = (feat: any) => {
          if (feat.geometry?.coordinates) {
            feat.geometry.coordinates = transform(
              feat.geometry.coordinates,
            );
          }
          return feat;
        };

        if (object.type === "FeatureCollection") {
          object.features = object.features.map(transformFeature);
        } else if (object.type === "Feature") {
          object = transformFeature(object);
        }
      }

      let featureToEdit = object;
      if (object.type === "FeatureCollection") {
        featureToEdit = object.features?.[0];
      }

      if (!featureToEdit) {
        error.value = "Não foi possível encontrar uma geometria no arquivo.";
        return;
      }

      delete featureToEdit.crs;
      polygonEdit.editFeature(featureToEdit);
      polygonEdit.fetchData(featureToEdit);
      clearCurrentPage();

      const geometry = featureToEdit.geometry;
      if (geometry?.coordinates) {
        flyTo({
          bounds: getGeoJsonBounds(geometry),
          bearing: 0,
        });
      }
    } catch (err: any) {
      error.value =
        typeof err === "string" ? err : "Erro ao carregar o arquivo GeoJSON.";
    }
  };

  const handleOpenProspectiveSearch = () => {
    navigateTo(<ProspectiveSearchPage key="nav-prospective-search" />);
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-background/90 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b bg-background/70 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <span
              className="h-4 w-4 shrink-0"
              style={{
                backgroundColor: "currentColor",
                mask: "url(/capivara-icone.svg) no-repeat center / contain",
                WebkitMask: "url(/capivara-icone.svg) no-repeat center / contain",
              }}
            />
            <h5 className="m-0 text-sm font-semibold">{title}</h5>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-full"
          aria-label={`Fechar ${title}`}
          onClick={clearCurrentPage}
        >
          <UrbisIcon name="close" className="text-base" aria-hidden="true" />
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {/* Localização do imóvel Introduction */}
        <div className="space-y-2">
          <h6 className="text-xs font-semibold text-foreground">
            Localização do imóvel
          </h6>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            É possível gerar a FIU de um imóvel de até <strong>500.000 m²</strong> selecionando um polígono no mapa, seja um já existente (ex.: Lote fiscal), ou um inserido através das ferramentas <em>Importar arquivo georreferenciado</em> (ex.: arquivo de levantamento topográfico) ou <em>Desenhar e anotar</em>. Para maiores informações, escolha a opção abaixo:
          </p>
        </div>

        {/* 3 Opções de Localização (Item 0052) */}
        <div className="space-y-2">
          {/* Opção 1: Selecionar polígono existente */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setExpandedOption(expandedOption === "select" ? null : "select")}
              className="w-full p-2.5 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SquareMousePointer className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Selecionar polígono existente
                </span>
              </div>
              {expandedOption === "select" ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {expandedOption === "select" && (
              <div className="p-2.5 pt-0 border-t bg-muted/10 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
                <p>
                  Para gerar a FIU a partir da seleção de um polígono no Mapa, clique dentro do imóvel para abrir as <strong>Tabelas de atributos</strong> das geometrias visíveis, e depois clique no botão <strong>&ldquo;Iniciar FIU&rdquo;</strong> (com ícone da capivara) junto à geometria desejada.
                </p>
                <p>
                  Será exibida a geometria selecionada, permitindo ajustes de vértices pelo usuário, e deverá ser clicado no botão <strong>Confirmar geometria</strong> para prosseguir.
                </p>
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-2 text-[10.5px] text-amber-900 dark:text-amber-200 leading-snug">
                  <strong>ATENÇÃO:</strong> o FIU só estará disponível para geometrias de algumas camadas (ex.: Lotes fiscais) e selecionando um polígono (ou seja, não é possível puxar a FIU de um ponto, linha, ou de múltiplos polígonos de uma vez).
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs font-medium"
                  onClick={handleStartPolygonSelection}
                >
                  <SquareMousePointer className="mr-2 h-3.5 w-3.5" />
                  Clique no mapa para selecionar
                </Button>
              </div>
            )}
          </div>

          {/* Opção 2: Importar arquivo georreferenciado */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setExpandedOption(expandedOption === "upload" ? null : "upload")}
              className="w-full p-2.5 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Importar arquivo georreferenciado
                </span>
              </div>
              {expandedOption === "upload" ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {expandedOption === "upload" && (
              <div className="p-2.5 pt-0 border-t bg-muted/10 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
                <p>
                  Para gerar a FIU a partir de arquivos georreferenciados, utilize os campos abaixo para enviar seu arquivo GeoJSON. Após a importação, siga as instruções para a seleção de polígonos e confirme sua geometria.
                </p>
                <div className="space-y-2 pt-1">
                  <div className="grid gap-1">
                    <label htmlFor="location-geojson-crs" className="text-xs font-medium text-foreground">
                      Como estão as coordenadas do arquivo?
                    </label>
                    <select
                      id="location-geojson-crs"
                      className="h-8 rounded-md border bg-background px-2.5 text-xs text-foreground"
                      value={crs.value}
                      onChange={(event) =>
                        (crs.value = event.currentTarget.value as typeof crs.value)
                      }
                    >
                      <option value="EPSG:31983">Metros — SIRGAS 2000 / UTM 23S</option>
                      <option value="EPSG:4674">Latitude/longitude — SIRGAS 2000</option>
                      <option value="EPSG:4326">Latitude/longitude — WGS 84</option>
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <label htmlFor="location-geojson" className="text-xs font-medium text-foreground">
                      Arquivo GeoJSON
                    </label>
                    <Input
                      id="location-geojson"
                      className="h-8 text-xs"
                      type="file"
                      accept=".geojson,application/geo+json,application/json"
                      onChange={(event) => {
                        file.value = event.currentTarget.files?.[0] ?? null;
                        error.value = "";
                      }}
                    />
                  </div>

                  <a
                    href={selectedExample.href}
                    download
                    className="inline-flex items-center gap-1 text-[10.5px] text-primary hover:underline"
                  >
                    <UrbisIcon name="download" className="text-[10px]" aria-hidden="true" />
                    {selectedExample.label}
                  </a>

                  {error.value && (
                    <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
                      {error.value}
                    </p>
                  )}

                  <Button
                    className="w-full text-xs font-semibold"
                    onClick={handleImport}
                  >
                    <UploadCloud className="mr-2 h-3.5 w-3.5" />
                    Usar arquivo no mapa
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Opção 3: Desenhar e anotar */}
          <div className="rounded-xl border bg-card overflow-hidden shadow-2xs">
            <button
              type="button"
              onClick={() => setExpandedOption(expandedOption === "draw" ? null : "draw")}
              className="w-full p-2.5 flex items-center justify-between text-left hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <PenTool className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Desenhar e anotar
                </span>
              </div>
              {expandedOption === "draw" ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {expandedOption === "draw" && (
              <div className="p-2.5 pt-0 border-t bg-muted/10 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
                <p>
                  Para gerar a FIU a partir de desenhos no mapa, clique no botão abaixo para marcar os vértices no mapa. Feche o polígono clicando no primeiro ponto e confirme o contorno.
                </p>
                <Button className="w-full text-xs font-semibold" onClick={startDrawing}>
                  <PenTool className="mr-2 h-3.5 w-3.5" />
                  Começar desenho
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Uso pretendido (opcional) Section (Item 0052) */}
        <div className="rounded-xl border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-primary" />
            <h6 className="text-xs font-semibold text-foreground">
              Uso pretendido (opcional)
            </h6>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Caso já possua um uso pretendido para o imóvel, ele poderá ser informado antes da geração da FIU para que ela verifique se o uso é permitido pelo Zoneamento e quais os parâmetros urbanísticos associados a esse uso.
          </p>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Se ainda não tem uma localização definida, mas sabe os parâmetros urbanísticos e imobiliários que deseja (ex.: padaria, Gabarito de Altura Máxima até 15 m, em terrenos entre 300 e 600 m²), o Urbis pode te auxiliar a encontrar esse imóvel pela ferramenta <strong>Pesquisa prospectiva</strong>.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5 mt-1"
            onClick={handleOpenProspectiveSearch}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            Acessar Pesquisa Prospectiva
          </Button>
          <p className="text-[10px] text-muted-foreground/80 italic pt-1">
            * Somente após a seleção, ajuste e confirmação de uma localização é que será perguntado se deseja informar um uso pretendido.
          </p>
        </div>
      </div>
    </div>
  );
};
