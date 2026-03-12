import { Button } from "@/components/ui/button";
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
  const { editFeature, editFeatureTemplate } = usePolygonEditContext();
  const { navigateTo } = useNavigationContext();
  const { label = "Ajustar Perímetro" } = template;

  if (!template?.polygonTemplate && !editFeatureTemplate.value) {
    console.error("polygonTemplate is not defined in configs");
    return null;
  }

  const edit = () => {
    editFeature(data);

    navigateTo(
      <PolygonDetails
        template={template?.polygonTemplate ?? editFeatureTemplate.value ?? []}
        rootTemplate={rootTemplate!}
      />
    );
  };

  return (
    <Button variant="outline" className="w-full my-2" onClick={() => edit()}>
      {label}
    </Button>
  );
};

export const EditPolygonTemplate: ITemplatesDeclaration = {
  name: "edit-polygon",
  hiddenOnPrint: true,
  render: EditPolygonComponent,
};
