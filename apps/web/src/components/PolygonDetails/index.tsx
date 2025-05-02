import "@rmwc/button/styles";
import "@rmwc/card/styles";
import "bootstrap/dist/css/bootstrap.min.css";
import { ReactNode } from "react";
import { Card, CircularProgress } from "rmwc";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { ViewTemplate } from "../ViewTemplate";
import { ITemplate } from "../ViewTemplate/types/templates-type";

export const PolygonDetails = ({ template }: { template: ITemplate[] }) => {
  const { isEditing, data, loading, feature } = usePolygonEditContext();

  if (loading) {
    return (
      <Card className="card-details lote-information">
        {
          (
            <div className="card-container text-center">
              <CircularProgress label="progress" />
            </div>
          ) as ReactNode
        }
      </Card>
    );
  }
  if (isEditing.value && !data) {
    return (
      <Card className="card-details lote-information">
        {
          (
            <div className="card-container">
              <div>
                <span className="label">
                  Selecione uma área e <br /> clique para Salvar:
                </span>
              </div>
            </div>
          ) as ReactNode
        }
      </Card>
    );
  }

  if (isEditing.value && data)
    return (
      <div>
        <ViewTemplate
          templates={template}
          data={{ ...feature.value, response: data }}
        />
      </div>
    );

  return null;
};
