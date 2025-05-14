import { Button } from "rmwc";
import { useNavigationContext } from "../../../../hooks/useNavigationContext";
import { usePolygonEditContext } from "../../../../hooks/usePolygonEditContext";
import { PolygonDetails } from "../../../PolygonDetails";
import {
  ITemplateProps,
  ITemplatesDeclaration,
} from "../../types/templates-type";

const EditPolygonComponent = ({
  data,
  template,
  rootTemplate,
}: ITemplateProps) => {
  const { drawRef, setFeature, reset, setIsEditing } = usePolygonEditContext();
  const { navigateTo } = useNavigationContext();
  const { label = "Ajustar Perímetro" } = template;

  if (!drawRef) {
    console.error("MapContext is not initialized (drawRef is null)");
    return null;
  }

  if (!template?.polygonTemplate) {
    console.error("polygonTemplate is not defined in configs");
    return null;
  }

  const edit = () => {
    reset();
    const { current: draw } = drawRef;

    setFeature(data);
    setIsEditing(true);

    draw!.deleteAll();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    draw!.add(data as any);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const featureId = (data as any).id;
    if (featureId) {
      draw!.changeMode("direct_select", { featureId });
    }

    navigateTo(
      <PolygonDetails
        template={template.polygonTemplate!}
        rootTemplate={rootTemplate!}
      />
    );
  };

  return (
    <Button onClick={() => edit()} outlined>
      {label}
    </Button>
  );
};

export const EditPolygonTemplate: ITemplatesDeclaration = {
  name: "edit-polygon",
  hiddenOnPrint: true,
  render: EditPolygonComponent,
};
