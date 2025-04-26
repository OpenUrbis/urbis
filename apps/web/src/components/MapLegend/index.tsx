import { computed } from "@preact/signals";
import { useMapContext } from "../../hooks/useMapContext";
import { IGetConfigLayerSchema } from "../../types/fetch-map-config-type";

export const MapLegend = () => {
    const { layerSchemas } = useMapContext();

    const layers = computed(() => layerSchemas.value.filter((schema: IGetConfigLayerSchema) => schema.isVisible && schema.colors.length > 1));

    const renderLegend = (item: IGetConfigLayerSchema) => {
        return <div>{item.name}</div>
    }

    return <>
        {layers.value.length && <div>
            {layers.value.map(item => renderLegend(item))}
        </div>}
    </>
}