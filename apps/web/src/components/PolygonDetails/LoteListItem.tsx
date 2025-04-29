import { ReactNode } from "react";
import {
  ListItemPrimaryText,
  ListItemSecondaryText,
  ListItemText,
  SimpleListItem,
} from "rmwc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LoteListItem = ({ lote }: { lote: any }) => {
  const { properties } = lote;
  return (
    <SimpleListItem>
      {
        (
          <ListItemText>
            {
              (
                <ListItemPrimaryText>
                  Identificador #{properties.id.replace("lote_cidadao.", "")}
                </ListItemPrimaryText>
              ) as ReactNode
            }
            {
              (
                <ListItemSecondaryText>
                  {`SQL: ${properties.cd_setor_fiscal}` +
                    `-${properties.cd_quadra_fiscal}` +
                    `-${properties.cd_lote}\n` +
                    `${properties.cd_condominio} |\n` +
                    `${properties.nm_logradouro_completo ?? "-"}`}
                </ListItemSecondaryText>
              ) as ReactNode
            }
          </ListItemText>
        ) as ReactNode
      }
    </SimpleListItem>
  );
};
