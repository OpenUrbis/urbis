import { computed } from "@preact/signals";
import { useMapContext } from "../../context/MapContext/mapContext";
import { ViewTemplate } from "../ViewTemplate";
import "./style.scss";

export const FeaturesViewComponent = () => {
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
