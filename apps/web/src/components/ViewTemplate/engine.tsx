import { useCallback, useMemo } from "react";
import { ITemplate, ITemplateProps, ITemplatesMap } from "./dto/templatesDto";
import { VIEW_TEMPLATE_TEMPLATES } from "./templates";

export const ViewTemplateEngine = ({ template, data }: ITemplateProps) => {
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
          throw new Error("Template Type is not exist");

        const Template = templateTypes[templateType];

        return <Template template={props} data={data} />;
      } catch (e) {
        console.error(e);

        return <div>Error on loading template</div>;
      }
    },
    [templateTypes, data]
  );

  return <>{renderTemplate(template)}</>;
};
