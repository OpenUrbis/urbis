import { computed } from "@preact/signals";
import { Button, Card } from "@open-urbis/map-ui";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useMapContext } from "../../hooks/useMapContext";
import { MapContextSelectedFeature } from "../../types/map-context-type";
import { ViewTemplate } from "../ViewTemplate";
import "./style.scss";

export const FeaturesView = ({
  feature,
  isPrint,
}: {
  feature?: MapContextSelectedFeature;
  isPrint?: boolean;
}) => {
  const { selectedFeatures } = useMapContext();

  const view = computed(
    () =>
      feature ?? selectedFeatures.value?.[0] ?? { template: [], feature: {} },
  );

  const template = computed(() => view.value.template ?? []);
  const data = computed(() => view.value.feature ?? {});

  const hasPrintParams =
    (data.value as any)?.properties?.cd_setor_fiscal &&
    (data.value as any)?.properties?.cd_quadra_fiscal &&
    (data.value as any)?.properties?.cd_lote;

  const handlePrint = () => {
    if (!hasPrintParams) return;
    const props: any = (data.value as any).properties;
    const url = `/print?interactive=true&layerSchema=lotes&CQL_FILTER=cd_setor_fiscal = '${props.cd_setor_fiscal}' AND cd_quadra_fiscal = '${props.cd_quadra_fiscal}' AND cd_lote = '${props.cd_lote}' AND cd_condominio = '${props.cd_condominio}'`;
    window.open(url, "_blank");
  };

  if (!template.value.length) return null;

  return (
    <div className="relative">
      {hasPrintParams && !isPrint && (
        <div className="flex px-4 pt-2 justify-end mb-2">
          <Card className="rounded-full shadow-sm p-1">
            <Tooltip.Provider delayDuration={300}>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={handlePrint}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      print
                    </span>
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="top"
                    className="z-50 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md shadow-md"
                  >
                    Imprimir Capivara
                    <Tooltip.Arrow className="fill-foreground" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </Card>
        </div>
      )}
      <ViewTemplate
        templates={template.value}
        data={data.value}
        rootTemplate={template.value}
        isPrint={isPrint}
      />
    </div>
  );
};
