import { UrbisIcon } from "@open-urbis/map-ui";
import { memo } from "preact/compat";
import { useState } from "react";
import {
  ITemplateProps,
  ITemplatesDeclaration,
} from "../../types/templates-type";
import { ViewTemplateEngine } from "../../ViewTemplateEngine";
import { createFn } from "../../../../utils/createFn";

interface ITabItem {
  id: string;
  title: string;
  color?: string;
  dataContext?: any;
}

const WrapperTabsComponent = ({
  template,
  data,
  rootTemplate,
  isPrint,
}: ITemplateProps) => {
  const [activeTab, setActiveTab] = useState<string>("0");
  const [printActiveTab, setPrintActiveTab] = useState<string>("index");
  const properties = template.properties as any;
  const rawDataProp = properties?.data;

  // Evaluate data property to generate dynamic tabs if provided
  let itemsData = [data]; // default to current context
  if (rawDataProp) {
    try {
      if (typeof rawDataProp === "string") {
        const fn = createFn(rawDataProp);
        itemsData = fn(data);
      } else if (typeof rawDataProp === "function") {
        itemsData = rawDataProp(data);
      } else {
        itemsData = rawDataProp;
      }
    } catch (err) {
      console.error("Error on execute data function in wrapper-tabs: ", err);
      itemsData = [];
    }
  }

  // Create tab configurations
  const tabs: ITabItem[] = [];

  // Static/Index tab from the template definition if provided
  if (properties?.indexTab) {
    tabs.push({
      id: "index",
      title: properties.indexTab.title || "Geral",
      dataContext: data,
    });
  }

  // Dynamic tabs from itemsData
  if (Array.isArray(itemsData)) {
    itemsData.forEach((item, index) => {
      let title = `Item ${index + 1}`;
      let color = undefined;

      try {
        if (properties?.tabTitle) {
          const titleFn =
            typeof properties.tabTitle === "string"
              ? createFn(properties.tabTitle)
              : properties.tabTitle;
          title = titleFn({ data: item, parentData: data });
        }

        if (properties?.tabColor) {
          const colorFn =
            typeof properties.tabColor === "string"
              ? createFn(properties.tabColor)
              : properties.tabColor;
          color = colorFn({ data: item, parentData: data });
        }
      } catch (err) {
        console.error("Error evaluating tab property:", err);
      }

      tabs.push({
        id: String(index),
        title,
        color,
        dataContext: {
          ...(typeof item === "object" ? item : {}),
          __parentData: data,
        },
      });
    });
  }

  if (tabs.length === 0) return null;

  const getTemplatesForTab = (tab: ITabItem) =>
    tab.id === "index" && properties?.indexTab?.templates
      ? properties.indexTab.templates
      : template.templates || [];

  if (isPrint) {
    const renderPrintTabSection = (tab: ITabItem, className = "") => {
      const isIndexTab = tab.id === "index";

      return (
        <section
          key={`print-tab-${tab.id}`}
          className={`break-inside-avoid rounded-xl border border-border bg-card p-3 print:border-slate-200 print:bg-white ${className}`}
        >
          <div className="mb-2 flex items-center gap-2 border-b border-border pb-2 print:border-slate-100">
            {tab.color && (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: tab.color }}
              />
            )}
            <h3 className="truncate text-xs font-bold uppercase tracking-wide text-foreground print:text-slate-800">
              {tab.title}
            </h3>
          </div>
          <div className={isIndexTab ? "grid gap-3" : "grid gap-2"}>
            {getTemplatesForTab(tab).map((subTemplate: any, idx: number) => (
              <ViewTemplateEngine
                key={`print-tab-${tab.id}-template-${idx}`}
                template={subTemplate}
                data={tab.dataContext}
                rootTemplate={rootTemplate}
                isPrint={isPrint}
              />
            ))}
          </div>
        </section>
      );
    };

    if (properties?.printMode === "selectable") {
      const selectedTab =
        tabs.find((tab) => tab.id === printActiveTab) ?? tabs[0];

      return (
        <div className="grid w-full grid-cols-1 gap-3">
          <section
            className="break-inside-avoid rounded-xl border border-border bg-card p-3 print:hidden"
            data-fiu-pdf-ignore="true"
          >
            <div className="mb-2 border-b border-border pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                Escolha a interseção
              </h3>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                Selecione uma interseção para abrir o mapa e os detalhes. Isso
                evita carregar vários mapas ao mesmo tempo.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {tabs.map((tab) => {
                const active = tab.id === selectedTab.id;

                return (
                  <button
                    key={`print-tab-selector-${tab.id}`}
                    type="button"
                    onClick={() => setPrintActiveTab(tab.id)}
                    className={`inline-flex w-full min-w-0 items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold leading-snug transition-colors ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:bg-muted"
                    }`}
                    title={tab.title}
                  >
                    {tab.color && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full border border-black/10"
                        style={{ backgroundColor: tab.color }}
                      />
                    )}
                    <span className="min-w-0 whitespace-normal break-words">
                      {tab.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {renderPrintTabSection(selectedTab)}
        </div>
      );
    }

    return (
      <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {tabs.map((tab) =>
          renderPrintTabSection(
            tab,
            tab.id === "index" ? "lg:col-span-2 2xl:col-span-3" : "",
          ),
        )}
      </div>
    );
  }

  // Active tab context
  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  // Determine which templates to render based on if it's the index tab
  const templatesToRender = getTemplatesForTab(currentTab);

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("wrapper-tabs-scroll-container");
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 w-full gap-4">
      {/* Tabs Header with Scroll Buttons */}
      <div className="relative flex items-center border-b border-border pb-2 group min-w-0">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 z-10 p-1 bg-background shadow-md border border-border rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 -ml-2 focus:opacity-100"
          aria-label="Scroll left"
        >
          <UrbisIcon
            name="chevron_left"
            className="text-sm"
            aria-hidden="true"
          />
        </button>

        <div
          id="wrapper-tabs-scroll-container"
          className="flex w-full overflow-x-auto hide-scrollbar gap-2 scroll-smooth px-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex-shrink-0
                ${
                  activeTab === tab.id
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/70"
                }
              `}
              style={{ maxWidth: "200px" }}
              title={tab.title}
            >
              {tab.color && (
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                  style={{ backgroundColor: tab.color }}
                />
              )}
              <span className="truncate">{tab.title}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute right-0 z-10 p-1 bg-background shadow-md border border-border rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 -mr-2 focus:opacity-100"
          aria-label="Scroll right"
        >
          <UrbisIcon
            name="chevron_right"
            className="text-sm"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex flex-col gap-4 min-w-0">
        {templatesToRender.map((subTemplate: any, idx: number) => (
          <ViewTemplateEngine
            key={`tab-${currentTab.id}-template-${idx}`}
            template={subTemplate}
            data={currentTab.dataContext}
            rootTemplate={rootTemplate}
            isPrint={isPrint}
          />
        ))}
      </div>
    </div>
  );
};

export const WrapperTabsTemplate: ITemplatesDeclaration = {
  name: "wrapper-tabs",
  render: memo(WrapperTabsComponent),
};
