import { ReactNode } from "react";
import {
  ListItemPrimaryText,
  ListItemSecondaryText,
  ListItemText,
  SimpleListItem,
} from "rmwc";

export const IntersectionListItem = ({
  intersection,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intersection: any;
}) => {
  const { properties } = intersection;
  if (intersection.id.includes("macroareas")) {
    return (
      <SimpleListItem>
        {
          (
            <ListItemText style={{ maxWidth: "100%" }}>
              {
                (
                  <ListItemPrimaryText>
                    {properties.nm_perimetro_divisao_pde}
                  </ListItemPrimaryText>
                ) as ReactNode
              }
              {
                (
                  <ListItemSecondaryText>Macroarea</ListItemSecondaryText>
                ) as ReactNode
              }
            </ListItemText>
          ) as ReactNode
        }
      </SimpleListItem>
    );
  }
  if (intersection.id.includes("minianel_viario")) {
    return (
      <SimpleListItem>
        {
          (
            <ListItemText>
              {
                (
                  <ListItemPrimaryText>
                    {properties.nm_restricao_circulacao_veiculo}
                  </ListItemPrimaryText>
                ) as ReactNode
              }
              {
                (
                  <ListItemSecondaryText>Minianel Viario</ListItemSecondaryText>
                ) as ReactNode
              }
            </ListItemText>
          ) as ReactNode
        }
      </SimpleListItem>
    );
  }
  if (intersection.id.includes("subprefeitura")) {
    return (
      <SimpleListItem>
        {
          (
            <ListItemText>
              {
                (
                  <ListItemPrimaryText>
                    {properties.nm_subprefeitura}
                  </ListItemPrimaryText>
                ) as ReactNode
              }
              {
                (
                  <ListItemSecondaryText>Sub-Prefeitura</ListItemSecondaryText>
                ) as ReactNode
              }
            </ListItemText>
          ) as ReactNode
        }
      </SimpleListItem>
    );
  }
  if (intersection.id.includes("macrozonas")) {
    return (
      <SimpleListItem>
        {
          (
            <ListItemText>
              {
                (
                  <ListItemPrimaryText>
                    {properties.nm_perimetro_divisao_pde}
                  </ListItemPrimaryText>
                ) as ReactNode
              }
              {
                (
                  <ListItemSecondaryText>Macrozona</ListItemSecondaryText>
                ) as ReactNode
              }
            </ListItemText>
          ) as ReactNode
        }
      </SimpleListItem>
    );
  }

  if (intersection.id.includes("tombamentos-areas")) {
    return (
      <SimpleListItem>
        {
          (
            <ListItemText>
              {
                (
                  <ListItemPrimaryText>
                    {properties.nm_bairro}
                  </ListItemPrimaryText>
                ) as ReactNode
              }
              {
                (
                  <ListItemSecondaryText>
                    {properties.tx_resolucao_condephaat}
                  </ListItemSecondaryText>
                ) as ReactNode
              }
            </ListItemText>
          ) as ReactNode
        }
      </SimpleListItem>
    );
  }
  if (intersection.id.includes("zoneamento_geral")) {
    return (
      <SimpleListItem>
        {
          (
            <ListItemText>
              {
                (
                  <ListItemPrimaryText>
                    {properties.nm_perimetro_divisao_pde}
                  </ListItemPrimaryText>
                ) as ReactNode
              }
              {
                (
                  <ListItemSecondaryText>Zoneamento</ListItemSecondaryText>
                ) as ReactNode
              }
            </ListItemText>
          ) as ReactNode
        }
      </SimpleListItem>
    );
  }

  return null;
};
