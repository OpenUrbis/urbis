import { useNavigationContext } from "@/hooks/useNavigationContext";
import { usePolygonEditContext } from "@/hooks/usePolygonEditContext";
import { Button, Card, UrbisIcon } from "@open-urbis/map-ui";
import { computed, useSignal } from "@preact/signals";
import * as Tooltip from "@radix-ui/react-tooltip";
import { enabledFeatureFlags } from "../../features/feature-flags";
import { useMapContext } from "../../hooks/useMapContext";
import { MapContextSelectedFeature } from "../../types/map-context-type";
import { buildTaxLotFiuUrl, hasTaxLotFiuParams } from "../../utils/fiu";
import { FiuDisclaimerModal } from "../FiuDisclaimerModal";
import { PolygonDetails } from "../PolygonDetails";
import { ViewTemplate } from "../ViewTemplate";
import "./style.scss";

export * from "./FeatureAttributesTable";
export * from "./FeatureDetailsWindow";
export * from "./AttributesInspectionPanel";

export const FeaturesView = ({
  feature,
  isPrint,
}: {
  feature?: MapContextSelectedFeature;
  isPrint?: boolean;
}) => {
  const { selectedFeatures, activeHighlightFeature } = useMapContext();
  const polygonEdit = usePolygonEditContext();
  const { editFeature, editFeatureTemplate } = polygonEdit;
  const { navigateTo, navigatePop, clearCurrentPage } = useNavigationContext();
  const features = enabledFeatureFlags.value;

  const handleBack = () => {
    selectedFeatures.value = [];
    activeHighlightFeature.value = null;
    polygonEdit.reset();
    polygonEdit.setFeature(null);
    polygonEdit.drawRef?.current?.deleteAll();
    navigatePop();
    clearCurrentPage();
  };

  const view = computed(
    () =>
      feature ?? selectedFeatures.value?.[0] ?? { template: [], feature: {} },
  );

  const template = computed(() => view.value.template ?? []);
  const data = computed(() => view.value.feature ?? {});
  const showDisclaimer = useSignal(false);

  const hasPrintParams = features.fiu && hasTaxLotFiuParams(data.value);

  const handlePrint = () => {
    const url = buildTaxLotFiuUrl(data.value);
    if (!url) return;

    window.open(url, "_blank");
  };

  const handlePrintClick = () => {
    showDisclaimer.value = true;
  };

  const handleEdit = () => {
    if (!editFeatureTemplate.value) return;

    editFeature(data.value);

    navigateTo(
      <PolygonDetails
        template={editFeatureTemplate.value ?? []}
        rootTemplate={template.value!}
      />,
    );
  };

  if (!template.value.length) return null;

  return (
    <div className="relative">
      {!isPrint && (
        <div className="flex px-4 pt-2 justify-between items-center mb-2 gap-2">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="font-medium rounded-full text-xs h-8 px-3"
            >
              <UrbisIcon
                name="arrow_back"
                className="mr-1.5 text-sm"
                aria-hidden="true"
              />
              Voltar
            </Button>
          </div>

          <div className="flex gap-2">
            {hasPrintParams && (
              <Card className="rounded-full shadow-sm p-0.5">
                <Tooltip.Provider delayDuration={300}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-7 w-7 hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={handlePrintClick}
                        aria-label="Gerar FIU do lote"
                      >
                        <UrbisIcon
                          name="assignment"
                          className="text-[16px]"
                          aria-hidden="true"
                        />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        className="z-50 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md shadow-md"
                      >
                        Gerar FIU do lote
                        <Tooltip.Arrow className="fill-foreground" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </Card>
            )}
            {editFeatureTemplate.value && (
              <Card className="rounded-full shadow-sm p-0.5">
                <Tooltip.Provider delayDuration={300}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-7 w-7 hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={handleEdit}
                      >
                        <UrbisIcon
                          name="edit"
                          className="text-[16px]"
                          aria-hidden="true"
                        />
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        className="z-50 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md shadow-md"
                      >
                        Analisar com desenho do perímetro
                        <Tooltip.Arrow className="fill-foreground" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </Card>
            )}
          </div>
        </div>
      )}
      <ViewTemplate
        templates={template.value}
        data={data.value}
        rootTemplate={template.value}
        isPrint={isPrint}
      />
      <FiuDisclaimerModal
        isOpen={showDisclaimer.value}
        onOpenChange={(open) => (showDisclaimer.value = open)}
        onConfirm={handlePrint}
      />
    </div>
  );
};
