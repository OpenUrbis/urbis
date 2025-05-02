import { useCallback, useMemo } from "react";
import { ITemplate, ITemplateProps, ITemplatesMap } from "./types/templates-type";
import { VIEW_TEMPLATE_TEMPLATES } from "./templates";

export const ViewTemplateEngine = ({ template, data, rootTemplate }: ITemplateProps) => {
  const templateTypes: ITemplatesMap = useMemo(() => {
    const templates: ITemplatesMap = {};

    VIEW_TEMPLATE_TEMPLATES.forEach(
      (template) => (templates[template.name] = template.render)
    );

    return templates;
  }, []);

  const renderTemplate = useCallback(
    (props: ITemplate) => {
      const { type: templateType } = props;

      try {
        if (!templateType || !templateTypes?.[templateType])
          throw new Error("Template Type is not exist: " + templateType);

        const Template = templateTypes[templateType];

        return <Template template={props} data={data} rootTemplate={rootTemplate} />;
      } catch (e) {
        console.error(e);

        return <div>Error on loading template</div>;
      }
    },
    [templateTypes, data, rootTemplate]
  );

  return <>{renderTemplate(template)}</>;
};
