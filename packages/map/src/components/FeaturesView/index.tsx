import { computed } from "@preact/signals";
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
    () => {
      // Prioritize prop 'feature', then 'selectedFeatures' from context
      if (feature) return feature;
      // Safety check for selectedFeatures.value being null/undefined
      if (selectedFeatures?.value && selectedFeatures.value.length > 0) {
         return selectedFeatures.value[0];
      }
      return { template: [], feature: {} };
    }
  );

  // Compute individual signals safely, accessing .value of other computed signals
  // Note: When accessing view.value, if view itself is null (unlikely due to computed) or returns null, we need to handle it.
  // The error "Cannot read properties of null (reading 'value')" usually happens when accessing .value on a null object
  // OR when the signal content itself is null and we try to access property on it.
  
  // Note: We access .value directly in render to let Preact track dependencies.
  // The error likely comes from accessing view.value when view itself might be uninitialized 
  // or when using computed inside another computed in a way that causes issues during initial render.
  
  // Let's simplify and avoid nested computed for now to rule out signal dependency issues
  const currentView = view.value || { template: [], feature: {} };
  const template = currentView.template || [];
  const data = currentView.feature || {};

  console.log("FeaturesView Render:", { 
      featureProp: feature, 
      selectedFeaturesValue: selectedFeatures.value,
      resolvedView: currentView,
      templateLength: template.length
  });

  // Only render if template has items, otherwise it might just look "loading" if the consumer expects content.
  // However, "loading forever" suggests an error boundary catch or empty render without fallback.
  // If data is present but template is not matching, it might be an issue.
  
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
