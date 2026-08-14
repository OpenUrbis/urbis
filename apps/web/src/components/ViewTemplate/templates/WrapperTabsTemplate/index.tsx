import { memo } from "preact/compat";
import { useState } from "react";
import { ITemplateProps, ITemplatesDeclaration } from "../../types/templates-type";
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
          const titleFn = typeof properties.tabTitle === "string" 
            ? createFn(properties.tabTitle) 
            : properties.tabTitle;
          title = titleFn({ data: item, parentData: data });
        }
        
        if (properties?.tabColor) {
          const colorFn = typeof properties.tabColor === "string" 
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
        dataContext: { ...(typeof item === "object" ? item : {}), __parentData: data },
      });
    });
  }

  if (tabs.length === 0) return null;

  // Active tab context
  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];
  const isIndexTab = currentTab.id === "index";

  // Determine which templates to render based on if it's the index tab
  const templatesToRender = isIndexTab && properties?.indexTab?.templates 
    ? properties.indexTab.templates 
    : template.templates || [];

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('wrapper-tabs-scroll-container');
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="grid grid-cols-1 w-full gap-4">
      {/* Tabs Header with Scroll Buttons */}
      <div className="relative flex items-center border-b border-slate-200 pb-2 group min-w-0">
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 p-1 bg-white shadow-md border border-slate-200 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100 -ml-2 focus:opacity-100"
          aria-label="Scroll left"
        >
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>

        <div 
          id="wrapper-tabs-scroll-container"
          className="flex w-full overflow-x-auto hide-scrollbar gap-2 scroll-smooth px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex-shrink-0
                ${activeTab === tab.id 
                  ? "bg-slate-100 font-medium text-slate-900" 
                  : "text-slate-500 hover:bg-slate-50"
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
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 p-1 bg-white shadow-md border border-slate-200 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors opacity-0 group-hover:opacity-100 -mr-2 focus:opacity-100"
          aria-label="Scroll right"
        >
          <span className="material-symbols-outlined text-sm">chevron_right</span>
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
