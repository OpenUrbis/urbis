import "@rmwc/button/styles";
import "@rmwc/card/styles";
import "bootstrap/dist/css/bootstrap.min.css";
import { ReactNode } from "react";
import { Card, CircularProgress, List } from "rmwc";
import { usePolygonEditContext } from "../../hooks/usePolygonEditContext";
import { IntersectionListItem } from "./IntersectionListItem";
import { LoteListItem } from "./LoteListItem";
import { PolygonMap } from "./PolygonMap";

export const PolygonDetails = () => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lotes = data.features.filter(({ id }: any) =>
    id.includes("lote_cidadao")
  );
  const intersections = data.features.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ({ id }: any) => !id.includes("lote_cidadao")
  );

  if (isEditing.value && data)
    return (
      <div className="card-list">
        <Card className="card-details lote-information">
          {
            (
              <div className="card-container">
                <div>
                  <span className="label">Área selecionada:</span>
                </div>

                <PolygonMap
                  polygonCoordinates={feature.value.geometry.coordinates}
                />
              </div>
            ) as ReactNode
          }
        </Card>
        <Card className="card-details">
          {
            (
              <div className="card-container">
                <h5>Intersesões no perimetro:</h5>
              </div>
            ) as ReactNode
          }
          {
            (
              <List twoLine>
                {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  intersections.map((intersection: any) => (
                    <IntersectionListItem
                      key={intersection.id}
                      intersection={intersection}
                    />
                  ))
                }
              </List>
            ) as ReactNode
          }
        </Card>
        <Card className="card-details">
          {
            (
              <div className="card-container" style={{ marginBottom: "-12px" }}>
                <h5>{lotes.length} Lotes no Perímetro:</h5>
              </div>
            ) as ReactNode
          }
          {
            (
              <List twoLine>
                {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  lotes.map((lote: any) => (
                    <LoteListItem key={lote.id} lote={lote} />
                  ))
                }
              </List>
            ) as ReactNode
          }
        </Card>
      </div>
    );

  return null;
};
