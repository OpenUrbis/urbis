import { Button } from "rmwc";
import { useNavigationContext } from "../../../../hooks/useNavigationContext";
import { usePolygonEditContext } from "../../../../hooks/usePolygonEditContext";
import { PolygonDetails } from "../../../PolygonDetails";
import {
  ITemplateProps,
  ITemplatesDeclaration,
} from "../../types/templates-type";

export const ProtocolActionTemplate: ITemplatesDeclaration = {
  name: "protocol-action",
  render: ({ data }: ITemplateProps) => {
    const { drawRef, setFeature, setIsEditing } = usePolygonEditContext();
    const { navigateTo } = useNavigationContext();

    if (!drawRef) {
      console.error("MapContext is not initialized (drawRef is null)");
      return null;
    }

    const edit = () => {
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

      navigateTo(<PolygonDetails />);
    };

    return (
      <Button onClick={() => edit()} raised>
        Protocolar
      </Button>
    );
  },
};
