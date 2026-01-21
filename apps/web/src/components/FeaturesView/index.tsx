import { computed } from "@preact/signals";
import { useMapContext } from "../../hooks/useMapContext";
import { ViewTemplate } from "../ViewTemplate";
import "./style.scss";

export const FeaturesView = () => {
  const { selectedFeatures } = useMapContext();

  const view = computed(() => selectedFeatures.value?.[0] ?? {});

  return (
    !!selectedFeatures.value.length && (
      <ViewTemplate
        templates={view.value?.template}
        data={view.value?.feature}
      />
    )
  );
};
