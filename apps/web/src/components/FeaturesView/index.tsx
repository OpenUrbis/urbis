import { computed } from "@preact/signals";
import { ViewTemplate } from "../ViewTemplate";
import "./style.scss";
import { useMapContext } from "../../hooks/useMapContext";

export const FeaturesView = () => {
  const { selectedFeatures } = useMapContext();

  const view = computed(() => selectedFeatures.value?.[0] ?? {});

  return (
    !!selectedFeatures.value.length && (
      <div className="features-view">
        <ViewTemplate
          templates={view.value?.template}
          data={view.value?.feature}
        />
      </div>
    )
  );
};
