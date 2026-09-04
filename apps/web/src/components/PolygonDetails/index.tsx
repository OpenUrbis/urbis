import { Button, Card, CardContent, UrbisIcon } from "@open-urbis/map-ui";
import { useSignal } from "@preact/signals";
import { useState, useMemo } from "preact/hooks";
import { Check, Edit, FileText } from "lucide-react";
import { enabledFeatureFlags } from "../../features/feature-flags";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { buildGeometryFiuUrl, canOpenFiuFromGeometry, getFeatureAreaSquareMeters } from "../../utils/fiu";
import { FiuDisclaimerModal } from "../FiuDisclaimerModal";
import { ITemplate } from "../ViewTemplate/types/templates-type";
import { IntendedUseCard } from "../ProspectiveSearch/ui/IntendedUseCard";
import { UsoSearchResultItem } from "../ProspectiveSearch/utils/types";

const INTERSECTION_NAME_FIELDS = [
  "nm_tema_divisao_pde",
  "nm_perimetro_divisao_pde",
  "tx_zoneamento_perimetro",
  "cd_zoneamento_perimetro",
  "nm_subprefeitura",
  "nm_distrito_municipal",
  "nm_area_tombada",
  "nm_area",
  "cd_lote",
];

const LAYER_LABELS: Record<string, string> = {
  "slui:zoneamento": "Zoneamento",
  "slui:subprefeitura": "Subprefeitura",
  "slui:distrito_municipal": "Distrito",
  "slui:lote_cidadao": "Lotes fiscais",
  "slui:minianel_viario": "Melhoramento viário",
  "slui:qualificacao_ambiental": "Qualificação ambiental",
  "slui:manancial_billings": "Manancial Billings",
  "slui:manancial_guarapiranga": "Manancial Guarapiranga",
  "slui:manancial_juquery": "Manancial Juquery",
  "slui:areas_contaminadas": "Área contaminada",
};

const formatLayerName = (layer?: string) => {
  if (!layer) return "Outra camada";

  return (
    LAYER_LABELS[layer] ??
    layer
      .replace(/^slui:/, "")
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
};

const formatPercent = (value: unknown) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;

  return `${numberValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
};

const formatArea = (value: unknown) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return null;

  return `${numberValue.toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  })} m²`;
};

const getIntersectionName = (properties: Record<string, unknown>) => {
  for (const field of INTERSECTION_NAME_FIELDS) {
    const value = properties[field];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value).trim();
    }
  }

  return null;
};

const buildIntersectionSummary = (features: unknown[]) => {
  const groups = new Map<
    string,
    {
      label: string;
      count: number;
      percentage: number;
      area: number;
      examples: string[];
    }
  >();

  features.forEach((feat) => {
    const properties =
      typeof feat === "object" && feat && "properties" in feat
        ? ((feat as { properties?: Record<string, unknown> }).properties ?? {})
        : {};
    const layer = typeof properties.layer === "string" ? properties.layer : "";
    const label = formatLayerName(layer);
    const percentage = Number(properties.totalAreaPercentage);
    const area = Number(properties.totalArea);
    const name = getIntersectionName(properties);
    const current = groups.get(label) ?? {
      label,
      count: 0,
      percentage: 0,
      area: 0,
      examples: [],
    };

    current.count += 1;
    if (Number.isFinite(percentage)) current.percentage += percentage;
    if (Number.isFinite(area)) current.area += area;
    if (
      name &&
      !current.examples.includes(name) &&
      current.examples.length < 2
    ) {
      current.examples.push(name);
    }

    groups.set(label, current);
  });

  return Array.from(groups.values()).sort(
    (a, b) => b.percentage - a.percentage || b.count - a.count,
  );
};

export const PolygonDetails = ({
  template,
  rootTemplate: _rootTemplate,
}: {
  template: ITemplate[];
  rootTemplate: ITemplate[];
}) => {
  const { isEditing, data, loading, feature, reset: resetPolygonEdit, drawRef, fetchData } =
    usePolygonEditContext();
  const { clearCurrentPage } = useNavigationContext();
  const features = enabledFeatureFlags.value;
  const showDisclaimer = useSignal(false);

  // States for Item 0054 workflow: Geometry confirmation and optional Intended Use
  const [isGeometryConfirmed, setIsGeometryConfirmed] = useState(false);
  const [selectedUse, setSelectedUse] = useState<UsoSearchResultItem | null>(null);

  const handleExit = () => {
    resetPolygonEdit();
    drawRef.current?.deleteAll();
    clearCurrentPage();
  };

  const fiuAvailability = canOpenFiuFromGeometry(feature.value);
  const summary = useMemo(
    () =>
      buildIntersectionSummary(
        Array.isArray(data?.features) ? data.features : [],
      ),
    [data],
  );
  const visibleSummary = summary.slice(0, 6);
  const hiddenSummaryCount = Math.max(
    summary.length - visibleSummary.length,
    0,
  );
  const totalArea = formatArea(data?.properties?.totalArea || (feature.value ? getFeatureAreaSquareMeters(feature.value) : null));

  const handleConfirmGeometry = () => {
    setIsGeometryConfirmed(true);
    if (feature.value && !data) {
      fetchData(feature.value);
    }
  };

  const openFiu = () => {
    if (!fiuAvailability.ok || (!data && !feature.value)) return;

    const url = buildGeometryFiuUrl({
      feature: feature.value,
      response: data || feature.value,
      template,
      selectedUse,
    });

    window.open(url, "_blank");
  };

  const handleOpenFiuClick = () => {
    if (!fiuAvailability.ok) return;
    showDisclaimer.value = true;
  };

  if (loading) {
    return (
      <Card className="m-2 rounded-xl">
        <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
          <UrbisIcon
            name="progress_activity"
            className="text-2xl animate-spin text-primary"
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground">Analisando perímetro no mapa...</span>
        </CardContent>
      </Card>
    );
  }

  // Vertex Editing Mode & Instructions (Item 0054)
  if (isEditing.value && !isGeometryConfirmed) {
    return (
      <Card className="m-2 rounded-xl border bg-background shadow-sm">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex items-start justify-between pb-2 border-b">
            <div>
              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Edit className="h-4 w-4 text-primary" />
                Localização do imóvel
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Você selecionou um imóvel para o qual é possível gerar uma FIU.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full -mr-1 -mt-1"
              onClick={handleExit}
              title="Sair / Cancelar"
              aria-label="Sair"
            >
              <UrbisIcon name="close" className="text-base" aria-hidden="true" />
            </Button>
          </div>

          {/* Vertex Editing Guidelines (Item 0054) */}
          <div className="rounded-xl border bg-muted/30 p-2.5 space-y-1.5 text-xs">
            <p className="font-medium text-foreground text-[11px]">
              Caso haja algum ajuste a ser feito no polígono, siga as instruções:
            </p>
            <ul className="text-[11px] space-y-1 text-muted-foreground list-disc list-inside">
              <li>para <strong className="text-foreground">mudar um vértice</strong>, clique em um ponto grande;</li>
              <li>para <strong className="text-foreground">apagar um vértice</strong>, clique e segure um ponto grande;</li>
              <li>para <strong className="text-foreground">criar um vértice</strong>, clique em um ponto pequeno;</li>
              <li>para <strong className="text-foreground">mover o polígono</strong>, clique e segure dentro dele e arraste;</li>
              <li>para <strong className="text-foreground">voltar uma ação</strong>, clique em <kbd className="font-mono px-1 py-0.5 bg-muted rounded border text-[10px]">Ctrl+Z</kbd> (Windows) ou <kbd className="font-mono px-1 py-0.5 bg-muted rounded border text-[10px]">Cmd+Z</kbd> (Mac).</li>
            </ul>
          </div>

          {totalArea && (
            <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
              <span>Área calculada:</span>
              <strong className="text-foreground">{totalArea}</strong>
            </div>
          )}

          {!fiuAvailability.ok && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] leading-snug text-amber-900">
              {fiuAvailability.reason}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <p className="text-[11px] text-muted-foreground">
              Se o polígono estiver correto, clique em Confirmar.
            </p>
            <Button
              className="w-full text-xs font-semibold"
              onClick={handleConfirmGeometry}
              disabled={!feature.value}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Confirmar geometria
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={handleExit}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // After Geometry Confirmation (Item 0054): Intended Use + FIU Generation
  if (isEditing.value && isGeometryConfirmed) {
    return (
      <div className="space-y-3 p-2">
        <Card className="rounded-xl border border-primary/30 bg-primary/5 shadow-sm">
          <CardContent className="p-3.5 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span
                  className="h-4 w-4 shrink-0"
                  style={{
                    backgroundColor: "currentColor",
                    mask: "url(/capivara-icone.svg) no-repeat center / contain",
                    WebkitMask: "url(/capivara-icone.svg) no-repeat center / contain",
                  }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <h6 className="text-sm font-semibold leading-tight text-foreground">
                  Ficha de Informações Urbanísticas - FIU
                </h6>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  Geometria confirmada com sucesso.
                </p>
              </div>
            </div>

            {/* Uso pretendido (opcional) Section */}
            <div className="rounded-xl border bg-background p-3 space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Uso pretendido (opcional)
              </label>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Caso já possua um uso pretendido e deseje verificar sua permissão pelo Zoneamento e quais os parâmetros urbanísticos associados a ele, selecione abaixo:
              </p>
              <IntendedUseCard
                selectedUse={selectedUse}
                onSelectUse={setSelectedUse}
              />
            </div>

            <Button
              className="w-full text-xs font-semibold"
              onClick={handleOpenFiuClick}
              disabled={!fiuAvailability.ok}
            >
              <FileText className="mr-2 h-4 w-4" />
              Gerar FIU
            </Button>
          </CardContent>
        </Card>

        {/* Summary card if analysis data available */}
        {data && (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="p-3">
              <div className="mb-2.5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">Resultado da análise</p>
                  <p className="text-[11px] text-muted-foreground">
                    {summary.length > 0
                      ? `${summary.length} grupo${summary.length === 1 ? "" : "s"} de interseção.`
                      : "Nenhuma interseção encontrada."}
                  </p>
                </div>
                {totalArea && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {totalArea}
                  </span>
                )}
              </div>

              {visibleSummary.length > 0 && (
                <div className="space-y-1.5">
                  {visibleSummary.map((item) => (
                    <div key={item.label} className="rounded-lg border bg-card px-2.5 py-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground truncate">{item.label}</span>
                      <span className="font-semibold text-primary text-[11px] shrink-0">
                        {formatPercent(item.percentage) || `${item.count} item`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <FiuDisclaimerModal
          isOpen={showDisclaimer.value}
          onOpenChange={(open) => (showDisclaimer.value = open)}
          onConfirm={openFiu}
        />
      </div>
    );
  }

  return null;
};
