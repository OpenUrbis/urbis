import { Button, UrbisIcon } from "@open-urbis/map-ui";
import { TableProperties, MousePointerClick, Info } from "lucide-react";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useMapContext } from "../../hooks/useMapContext";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";

export const AttributesInspectionPanel = () => {
  const { clearCurrentPage } = useNavigationContext();
  const { selectedFeatures, isPickingLocation, onLocationPick, activeHighlightFeature } = useMapContext();
  const polygonEdit = usePolygonEditContext();

  const handleClearSelection = () => {
    selectedFeatures.value = [];
    activeHighlightFeature.value = null;
    polygonEdit.reset();
    polygonEdit.setFeature(null);
    polygonEdit.drawRef?.current?.deleteAll();
  };

  const handleClosePanel = () => {
    handleClearSelection();
    clearCurrentPage();
  };

  const handleStartInspection = () => {
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

  return (
    <div className="overflow-hidden rounded-xl border bg-background/90 shadow-sm">
      <div className="flex items-start justify-between gap-2 border-b bg-background/70 p-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-primary mb-1">
            <TableProperties className="h-4 w-4" />
            <h5 className="m-0 text-sm font-semibold">Tabela de Atributos</h5>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Veja os atributos de geometrias selecionados do mapa.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-full"
          aria-label="Fechar painel de atributos"
          onClick={handleClosePanel}
        >
          <UrbisIcon name="close" className="text-base" aria-hidden="true" />
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {/* Simple & honest explanation */}
        <div className="rounded-xl border bg-muted/20 p-3 text-xs space-y-2">
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Clique no botão abaixo para ativar a consulta e, em seguida, clique no elemento ou local no mapa para, se o elemento estiver habilitado, abrir a <strong>Tabela de Atributos</strong> com busca rápida, nomes tratados e exportação de planilha.
          </p>
        </div>

        {/* Right Click Tip */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <Info className="h-3.5 w-3.5" />
            <span>Dica do mapa</span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Você também pode clicar com o <strong>botão direito do mouse</strong> em qualquer ponto do mapa e selecionar <em>&ldquo;Consultar tabela de atributos aqui&rdquo;</em>.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <Button
            className="w-full text-xs font-bold h-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            onClick={handleStartInspection}
          >
            <MousePointerClick className="mr-2 h-4 w-4" />
            Clique no mapa para consultar
          </Button>

          {selectedFeatures.value.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={handleClearSelection}
            >
              Limpar seleção atual
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
