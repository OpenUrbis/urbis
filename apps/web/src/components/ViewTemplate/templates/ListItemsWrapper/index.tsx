import { ReactNode } from "react";
import { List, ListItemText, SimpleListItem } from "rmwc";
import { createFn } from "../../../../utils/createFn";
import { IListItemsProperties } from "../../types/list-items-type";
import { ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";

export const ListItemsWrapper: ITemplatesDeclaration = {
  name: "wrapper-list-items",
  render: ({ template, data, key }) => {
    const { templates = [] } = template;
    const properties = template.properties as IListItemsProperties;

    if (!properties?.data) {
      console.error("'Data' is not defined in 'wrapper-list-items' properties");
      return null;
    }

    const listItems = () => {
      const strFn = createFn(properties.data!);

      try {
        return strFn(data);
      } catch (err) {
        console.error('Error on execute "data": ', err);
        return [];
      }
    };

    return (
      <List twoLine={properties?.twoLine}>
        {// eslint-disable-next-line @typescript-eslint/no-explicit-any
        listItems()?.map((value: any, i: number) => (
          <SimpleListItem key={value?.id ?? i}>
            {
              (
                <ListItemText style={{ maxWidth: "100%!important" }}>
                  {templates.map(
                    (itemTemplate) =>
                      (
                        <ViewTemplateEngine
                          template={itemTemplate}
                          data={value}
                        />
                      ) as ReactNode
                  )}
                </ListItemText>
              ) as ReactNode
            }
          </SimpleListItem>
        ))}
      </List>
    );
  },
};
