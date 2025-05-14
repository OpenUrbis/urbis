import { useCallback, useMemo } from "react";
import { VIEW_TEMPLATE_TEMPLATES } from "./templates";
import {
  ITemplate,
  ITemplateProps,
  ITemplatesMap,
} from "./types/templates-type";

export const ViewTemplateEngine = ({
  template,
  data,
  rootTemplate,
  isPrint,
}: ITemplateProps) => {
  const templateTypes: ITemplatesMap = useMemo(() => {
    const templates: ITemplatesMap = {};

    VIEW_TEMPLATE_TEMPLATES.forEach((template) => {
      if (isPrint && template.hiddenOnPrint)
        templates[template.name] = () => null;
      else templates[template.name] = template.render;
    });

    return templates;
  }, [isPrint]);

  const renderTemplate = useCallback(
    (props: ITemplate) => {
      const { type: templateType } = props;

      try {
        if (!templateType || !templateTypes?.[templateType])
          throw new Error("Template Type is not exist: " + templateType);

        const Template = templateTypes[templateType];

        return (
          <section style={{ pageBreakInside: "avoid", pageBreakAfter: "auto" }}>
            <Template
              template={props}
              data={data}
              rootTemplate={rootTemplate}
              isPrint={isPrint}
            />
          </section>
        );
      } catch (e) {
        console.error(e);

        return <div>Error on loading template</div>;
      }
    },
    [templateTypes, data, rootTemplate, isPrint]
  );

  return <>{renderTemplate(template)}</>;
};
