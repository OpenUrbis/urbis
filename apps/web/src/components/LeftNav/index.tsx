import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  cn,
  Drawer,
  DrawerContent,
  DrawerTitle,
  Button,
} from "@open-urbis/map-ui";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useSearchContext } from "../../hooks/useSearchContext";
import { Search } from "../Search";
import { SlidersHorizontal, Globe, PenLine, TableProperties, FileSpreadsheet } from "lucide-react";
import { LocationSelectionCard } from "../LocationSelectionCard";
import { ProspectiveSearchPage } from "../../pages/Map/ProspectiveSearchPage";
import { enabledFeatureFlags } from "../../features/feature-flags";
import { MapLicense } from "../MapLicense";
import { GeometryWorkflowPanel } from "../GeometryWorkflowPanel";
import { AttributesInspectionPanel } from "../FeaturesView/AttributesInspectionPanel";
import { DrawingWorkflowPanel } from "../DrawingWorkflowPanel";
import { mapTutorialVisible } from "../MapTutorial/state";

const DigitalAddressPanel = () => (
  <LocationSelectionCard
    initialOption="coordenadas"
    initialInputType="digital"
  />
);

export const LeftNav = () => {
  const {
    drawerOpen,
    toggleDrawer,
    currentPage,
    navigateTo,
    isProspectiveSearchActive,
  } = useNavigationContext();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const features = enabledFeatureFlags.value;
  const { currentTerm, searchQuery, concatenatedSearch } = useSearchContext();
  const hasActiveSearch =
    Boolean(currentTerm.value.trim()) || Boolean(searchQuery.data);

  const handleNavigate = (component: React.ReactNode) => {
    if (!drawerOpen.value) toggleDrawer();
    navigateTo(component);
  };

  const openDrawingSearch = () => {
    handleNavigate(<DrawingWorkflowPanel key="nav-drawing-workflow" />);
  };

  const locationMenuItems = [
    features.prospectiveSearch && {
      label: "Pesquisa Prospectiva",
      icon: <SlidersHorizontal className="h-4 w-4" />,
      onClick: () =>
        handleNavigate(<ProspectiveSearchPage key="nav-prospective-search" />),
    },
    {
      label: "Ficha Regional",
      icon: <Globe className="h-4 w-4" />,
      disabled: true,
    },
    features.fiu && {
      label: "Ficha de Informações Urbanísticas - FIU",
      description:
        "Obtenha de forma integrada dados urbanísticos úteis para empreender em qualquer parte da cidade.",
      icon: (
        <span
          className="h-4 w-4 shrink-0"
          style={{
            backgroundColor: "currentColor",
            mask: "url(/capivara-icone.svg) no-repeat center / contain",
            WebkitMask: "url(/capivara-icone.svg) no-repeat center / contain",
          }}
        />
      ),
      onClick: () =>
        handleNavigate(
          <GeometryWorkflowPanel
            key="nav-geometry-workflow-fiu"
            title="Ficha de Informações Urbanísticas - FIU"
            description="Obtenha de forma integrada dados urbanísticos úteis para empreender em qualquer parte da cidade."
          />,
        ),
    },
    {
      label: "Tabela de atributos",
      description:
        "Consulte a tabela de atributos e parâmetros ao clicar em qualquer geometria.",
      icon: <TableProperties className="h-4 w-4" />,
      onClick: () =>
        handleNavigate(<AttributesInspectionPanel key="nav-attributes-inspection" />),
    },
    features.concatenatedSearch && {
      label: "Explorar registros filtrados",
      description:
        "Consulte, filtre e exporte os dados cadastrais das camadas em formato de tabela.",
      icon: <FileSpreadsheet className="h-4 w-4" />,
      onClick: () => {
        concatenatedSearch.value = {
          ...concatenatedSearch.peek(),
          isOpen: true,
        };
      },
    },
    features.digitalAddress && {
      label: "Endereço Digital Urbis",
      icon: <img src="/ed.png" alt="" className="h-4 w-4" />,
      onClick: () => handleNavigate(<DigitalAddressPanel key="nav-digital" />),
    },
    features.geoJsonSearch && {
      label: "Desenhar",
      description:
        "Desenhe uma área para analisar dados urbanísticos ou criar uma camada no mapa.",
      icon: <PenLine className="h-4 w-4" />,
      onClick: openDrawingSearch,
    },
  ].filter(Boolean) as Array<{
    label: string;
    icon: React.ReactNode;
    description?: string;
    onClick?: () => void;
    disabled?: boolean;
  }>;

  const hasFocusedSidebarPage = Boolean(currentPage.value);
  const showTutorialLabels = mapTutorialVisible.value;

  const CollapsedMenuItem = ({
    icon,
    label,
    onClick,
    disabled,
    showTutorialLabels = false,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    disabled?: boolean;
    showTutorialLabels?: boolean;
  }) => {
    return (
      <div className="relative flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full bg-background/90 backdrop-blur-sm shadow-sm border hover:bg-accent",
            disabled && "opacity-55 cursor-not-allowed",
          )}
          onClick={disabled ? undefined : onClick}
          aria-disabled={disabled}
          aria-label={label}
        >
          {icon}
        </Button>
        <span
          aria-hidden="true"
          className={cn(
            "urbis-app-menu-layer pointer-events-none absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 w-max max-w-[480px] whitespace-normal rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] font-medium leading-tight text-popover-foreground shadow-md z-50 bg-background",
            showTutorialLabels
              ? "opacity-100"
              : "transition-all duration-200 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0",
          )}
        >
          {label}
        </span>
      </div>
    );
  };

  if (isDesktop) {
    return (
      <div
        className={cn(
          "relative h-full transition-all duration-300 flex flex-col pt-16 w-[432px] pointer-events-none",
          drawerOpen.value && hasFocusedSidebarPage
            ? "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-r"
            : "bg-transparent backdrop-blur-none border-transparent",
        )}
      >
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden p-3 w-[432px]",
            drawerOpen.value && hasFocusedSidebarPage ? "pointer-events-auto" : "pointer-events-none",
          )}
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
            {/* Search Input at Top when not on prospective search */}
            {!isProspectiveSearchActive.value && (
              <div className="pointer-events-auto">
                <Search />
              </div>
            )}

            {/* Active Subpage in Drawer */}
            {drawerOpen.value && hasFocusedSidebarPage && (
              <div className="transition-all duration-300 ease-in-out origin-top opacity-100 translate-y-0 h-auto">
                {currentPage.value}
              </div>
            )}

            {/* Floating circular icon menu over map when no subpage is open */}
            {!hasFocusedSidebarPage && !hasActiveSearch && (
              <div className="group pointer-events-auto flex flex-col gap-1.5 items-start animate-in fade-in slide-in-from-left-4 duration-300 pl-1 pt-1">
                {locationMenuItems.map((item) => (
                  <CollapsedMenuItem
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    onClick={item.onClick}
                    disabled={item.disabled}
                    showTutorialLabels={showTutorialLabels}
                  />
                ))}
              </div>
            )}
          </div>

          {drawerOpen.value && hasFocusedSidebarPage && (
            <div className="mt-3 flex shrink-0 justify-center border-t pt-3">
              <MapLicense placement="sidebar" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile View
  return (
    <>
      {/* Mobile Top Search & Floating Buttons when drawer closed */}
      {!drawerOpen.value && !hasFocusedSidebarPage && (
        <div className="fixed top-16 left-3 z-30 flex flex-col gap-2 pointer-events-auto">
          {!hasActiveSearch && (
            <div className="flex flex-col gap-1.5">
              {locationMenuItems.map((item) => (
                <CollapsedMenuItem
                  key={item.label}
                  label={item.label}
                  icon={item.icon}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  showTutorialLabels={showTutorialLabels}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <Drawer
        open={drawerOpen.value && hasFocusedSidebarPage}
        onOpenChange={(open: boolean) => {
          if (!open) {
            if (drawerOpen.value) toggleDrawer();
          }
        }}
      >
        <DrawerContent className="h-[86vh]">
          <DrawerTitle className="sr-only">Localização</DrawerTitle>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {currentPage.value}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
