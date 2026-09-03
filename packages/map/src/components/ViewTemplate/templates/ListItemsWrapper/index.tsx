import { ReactNode } from "react";
import { CLICK_ACTIONS_CONFIG } from "../../../../application-configs";
import { createFn } from "../../../../utils/createFn";
import { IListItemsProperties } from "../../types/list-items-type";
import { ITemplate, ITemplatesDeclaration } from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";

export const ListItemsWrapper: ITemplatesDeclaration = {
  name: "wrapper-list-items",
  render: ({ template, data, rootTemplate, isPrint }) => {
    const { templates = [] } = template;
    const properties = template.properties as IListItemsProperties;
    const clickActions = CLICK_ACTIONS_CONFIG();

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleItem = (item: any) => {
      const { onItemClick } = properties;
      if (!onItemClick) return;
      const { action, params } = onItemClick;

      if (!params?.template) {
        console.error("Template is not defined", onItemClick);
        return;
      }

      if (
        !Array.isArray(params?.template) &&
        String(params?.template).toLocaleLowerCase() === "root"
      )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params.template = rootTemplate as any;

      const actionFn = clickActions[action];
      if (!actionFn) {
        console.error(
          `Action "${action}" is not found in CLICK_ACTIONS_CONFIG of project`,
        );
        return;
      }

      actionFn(params, {
        latitude: 0,
        longitude: 0,
        template: params.template as unknown as ITemplate[],
        feature: item,
      });
    };

    return (
      <ul className="divide-y divide-border p-0 list-none m-0">
        {// eslint-disable-next-line @typescript-eslint/no-explicit-any
        listItems()?.map((value: any, i: number) => (
          <li
            key={value?.id ?? i}
            className="cursor-pointer hover:bg-muted/50 p-2 transition-colors"
            onClick={() => handleItem(value)}
          >
            <div className="w-full">
              {templates.map(
                (itemTemplate) =>
                  (
                    <ViewTemplateEngine
                      template={itemTemplate}
                      data={value}
                      rootTemplate={rootTemplate}
                      isPrint={isPrint}
                    />
                  ) as ReactNode,
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  },
};
