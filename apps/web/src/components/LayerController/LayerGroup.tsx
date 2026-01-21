import { computed } from "@preact/signals";
import { useState } from "preact/hooks";
import { Icon } from "rmwc";
import { useMapContext } from "../../hooks/useMapContext";
import { IGetConfigLayerGroup } from "../../types/fetch-map-config-type";
import "./LayerGroup.scss";
import { LayerItem } from "./LayerItem";

export const LayerGroup = ({
  group,
  isSubGroup,
}: {
  group: IGetConfigLayerGroup;
  isSubGroup?: boolean;
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { layerSchemas } = useMapContext();

  const layers = computed(() =>
    layerSchemas.value.filter((value) => value.groupId === group.id)
  );

  const renderContentClassName = computed(() =>
    layers.value.length ? "group-layer-content" : "group-layer-content-empty"
  );

  const renderItems = computed(() => {
    if (!layers.value || !layers.value?.length) return;

    return layers.value.map((item) => <LayerItem key={item.id} item={item} />);
  });

  const renderHeaderClassName = () =>
    isSubGroup ? "subgroup-layer-header" : "group-layer-header";

  const renderGroupClassName = () => {
    let result = "layer-group";

    if (isSubGroup) result += " subgroup";

    if (group.id === "general") result += " general-group";

    return result;
  };

  const renderSubGroups = () => {
    if (!group || !group?.childGroups || !group?.childGroups?.length) return;

    return group.childGroups.map((subGroup) => (
      <LayerGroup key={subGroup.id} group={subGroup} isSubGroup={true} />
    ));
  };

  return (
    <>
      <div key={group.id} className={renderGroupClassName()}>
        <section
          className={renderHeaderClassName()}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <h3>{group.name}</h3>
          <Icon
            icon={isCollapsed ? "expand_more" : "expand_less"}
            style={{ cursor: "pointer" }}
          />
        </section>
        {isCollapsed && (
          <div className={renderContentClassName.value}>
            {renderItems.value}
            {renderSubGroups()}
          </div>
        )}
      </div>
    </>
  );
};
