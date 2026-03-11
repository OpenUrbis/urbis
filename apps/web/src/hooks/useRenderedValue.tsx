import { Data as ejsData, render as ejsRender } from "ejs";
import { useMemo } from "preact/compat";
import { ITemplateProps } from "../components/ViewTemplate/types/templates-type";

export const useRenderedValue = ({ template, data }: ITemplateProps) => {
  const value = useMemo(() => {
    const templateValue = template?.value;
    if (!templateValue) return "-";

    try {
      return ejsRender(templateValue, data as ejsData);
    } catch (err) {
      console.error("Erro ao renderizar EJS:", err);
      // Intentionally swallow the error to prevent console spam while the user is typing custom EJS in the builder.
      // We render a user-friendly feedback string instead.
      return "EJS inválido";
    }
  }, [template?.value, data]);

  return value;
};
