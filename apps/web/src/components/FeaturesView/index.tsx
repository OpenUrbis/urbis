import { computed } from "@preact/signals";
import { useMapContext } from "../../hooks/useMapContext";
import { MapContextSelectedFeature } from "../../types/map-context-type";
import { ViewTemplate } from "../ViewTemplate";
import "./style.scss";

export const FeaturesView = ({
  feature,
}: {
  feature?: MapContextSelectedFeature;
}) => {
  const { selectedFeatures } = useMapContext();

  const view = computed(
    () =>
      feature ?? selectedFeatures.value?.[0] ?? { template: [], feature: {} }
  );

  const template = computed(() => view.value.template ?? []);
  const data = computed(() => view.value.feature ?? {});

  return (
    !!selectedFeatures.value.length && (
      <ViewTemplate templates={template.value} data={data.value} rootTemplate={template.value} />
    )
  );
};
