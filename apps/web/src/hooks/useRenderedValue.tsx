import { Data as ejsData, render as ejsRender } from "ejs";
import { useMemo } from "preact/compat";
import { ITemplateProps } from "../components/ViewTemplate/types/templates-type";

export const useRenderedValue = ({ template, data }: ITemplateProps) => {
  const value = useMemo(() => {
    console.log(template.value, data);
    const templateValue = template?.value;
    if (!templateValue) return "-";

    try {
      return ejsRender(templateValue, data as ejsData);
    } catch (err) {
      console.error(
        `Error on render value from ${templateValue} with EJS and data.`,
        data,
        err
      );
      return "Error on render value";
    }
  }, [template?.value, data]);

  return value;
};
