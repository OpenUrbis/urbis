import { useCallback, useMemo } from "react";
import { useTemplateRegistry } from "./TemplateRegistryContext";
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
  viewMode,
}: ITemplateProps) => {
  const { templates: registeredTemplates } = useTemplateRegistry();

  // Use registered templates from context (e.g. from Builder) or fallback to default
  const sourceTemplates = registeredTemplates || VIEW_TEMPLATE_TEMPLATES;

  const templateTypes: ITemplatesMap = useMemo(() => {
    const templates: ITemplatesMap = {};

    sourceTemplates.forEach((template) => {
      if (isPrint && template.hiddenOnPrint)
        templates[template.name] = () => null;
      else templates[template.name] = template.render;
    });

    return templates;
  }, [isPrint, sourceTemplates]);

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
              viewMode={viewMode}
            />
          </section>
        );
      } catch (e) {
        console.error(e);

        return <div>Error on loading template</div>;
      }
    },
    [templateTypes, data, rootTemplate, isPrint, viewMode],
  );

  return <>{renderTemplate(template)}</>;
};
