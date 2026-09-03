import { computed } from "@preact/signals";
import { useMapContext } from "../../hooks/useMapContext";
import { MapContextSelectedFeature } from "../../types/map-context-type";
import { ViewTemplate } from "../ViewTemplate";
import "./style.scss";

export * from "./FeatureAttributesTable";

export const FeaturesView = ({
  feature,
  isPrint,
}: {
  feature?: MapContextSelectedFeature;
  isPrint?: boolean;
}) => {
  const { selectedFeatures } = useMapContext();

  const view = computed(() => {
    // Prioritize prop 'feature', then 'selectedFeatures' from context
    if (feature) return feature;
    // Safety check for selectedFeatures.value being null/undefined
    if (selectedFeatures?.value && selectedFeatures.value.length > 0) {
      return selectedFeatures.value[0];
    }
    return { template: [], feature: {} };
  });

  const currentView = view.value || { template: [], feature: {} };
  const template = currentView.template || [];
  const data = currentView.feature || {};

  if (!template || template.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Nenhuma informação disponível para este item.
      </div>
    );
  }

  return (
    <ViewTemplate
      templates={template}
      data={data}
      rootTemplate={template}
      isPrint={isPrint}
    />
  );
};
