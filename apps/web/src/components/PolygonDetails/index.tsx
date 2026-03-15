import { Card, CardContent } from "@open-urbis/map-ui";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { ViewTemplate } from "../ViewTemplate";
import { ITemplate } from "../ViewTemplate/types/templates-type";

export const PolygonDetails = ({
  template,
  rootTemplate,
}: {
  template: ITemplate[];
  rootTemplate: ITemplate[];
}) => {
  const { isEditing, data, loading, feature } = usePolygonEditContext();

  if (loading) {
    return (
      <Card className="m-2 rounded-xl">
        <CardContent className="p-4 flex justify-center">
          <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
        </CardContent>
      </Card>
    );
  }
  if (isEditing.value && !data) {
    return (
      <Card className="m-2 rounded-xl">
        <CardContent className="p-4">
          <div>
            <span className="font-bold text-primary">
              Selecione uma área e <br /> clique para Salvar:
            </span>
            <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
              Para selecionar e poder editar os vértices do elemento, clique nele
              duas vezes e faça as edições necessárias depois clique em Salvar /
              Atualizar.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isEditing.value && data)
    return (
      <div>
        <ViewTemplate
          templates={template}
          data={{ ...feature.value, response: data }}
          rootTemplate={rootTemplate}
        />
      </div>
    );

  return null;
};
