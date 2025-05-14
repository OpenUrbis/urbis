import { Button } from "rmwc";
import { createFn } from "../../../../utils/createFn";
import {
  ITemplateProps,
  ITemplatesDeclaration,
} from "../../types/templates-type";
import "./style.scss";

export const ButtonTemplate: ITemplatesDeclaration = {
  name: "button",
  hiddenOnPrint: true,
  render: ({ template, data }: ITemplateProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { label = "Ação", properties } = template as any;

    if (!properties?.action) {
      console.error(`action is not defined to button with label: "${label}"`);
      return null;
    }

    const action = createFn(properties?.action, false);

    return action ? (
      <Button className="button-template" onClick={() => action(data)} outlined>
        {label}
      </Button>
    ) : null;
  },
};
