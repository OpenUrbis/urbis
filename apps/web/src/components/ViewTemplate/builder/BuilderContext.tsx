import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { ITemplate } from "../types/templates-type";
import { IBuilderContextType } from "./types";
import { BUILDER_TEMPLATES } from "./registry";

const BuilderContext = createContext<IBuilderContextType | undefined>(undefined);

const DEFAULT_MOCK_DATA = {
  type: "Feature",
  id: "view_lote_cidadao.fid-61a246a4_19c75dbcc55_-3c96",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-46.6377256887, -23.5360541954],
        [-46.6377824188, -23.5360920014],
        [-46.6377589499, -23.5361301216],
        [-46.6376498339, -23.5363073577],
        [-46.6376251762, -23.5363474093],
        [-46.6375660449, -23.5363090894],
        [-46.6375909971, -23.5362692496],
        [-46.6377024932, -23.5360912309],
        [-46.6377256887, -23.5360541954],
      ],
    ],
  },
  geometry_name: "geometry",
  properties: {
    id: "lote_cidadao.2063003",
    cd_identificador: 2063003,
    cd_identificador_original_lote: 8830984,
    cd_setor_fiscal: "008",
    cd_tipo_quadra: "F",
    tx_tipo_quadra: "FISCAL",
    cd_quadra_fiscal: "076",
    cd_subquadra_fiscal: null,
    cd_condominio: "00",
    cd_tipo_lote: "F",
    tx_tipo_lote: "FISCAL",
    cd_lote: "0098",
    cd_situacao: 1,
    cd_digito_sql: "9",
    cd_logradouro: "085367",
    nm_logradouro_completo: "R DOS GUSMOES",
    cd_numero_porta: "107",
    tx_complemento_endereco: "111 119",
    tx_situ_lote: "ATIVO",
    cd_tipo_uso_imovel: "62",
    dc_tipo_uso_imovel: "Não residencial",
    cd_tipo_terreno_imovel: 1,
    qt_area_terreno: 214,
    qt_area_construida: 45,
    setor_quadra_lote_condominio: "008 076 0098 00",
    endereco_completo: "R DOS GUSMOES 107 111 119",
  },
  bbox: [
    -46.6377824188, -23.5363474093, -46.6375660449, -23.5360541954,
  ],
};

export const useBuilder = () => {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within a BuilderProvider");
  }
  return context;
};

interface BuilderProviderProps {
  initialTemplate: ITemplate[];
  children: ReactNode;
}

export const BuilderProvider = ({
  initialTemplate,
  children,
}: BuilderProviderProps) => {
  const [template, setTemplate] = useState<ITemplate[]>(initialTemplate);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mockData, setMockData] = useState<any>(DEFAULT_MOCK_DATA);
  const [highlightConfig, setHighlightConfig] = useState(0);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const triggerHighlightConfig = useCallback(() => {
    setHighlightConfig((prev) => prev + 1);
  }, []);

  // Helper to find and update a node in the tree
  const updateNode = useCallback(
    (root: ITemplate, id: string, updates: Partial<ITemplate>): ITemplate => {
      if (root.id === id) {
        return { ...root, ...updates };
      }
      // Recursive update for children
      const config = BUILDER_TEMPLATES.find((t) => t.name === root.type);
      const childrenProp = config?.childrenProp || "templates";
      // @ts-ignore
      const children = root[childrenProp];

      if (children && Array.isArray(children)) {
        return {
          ...root,
          [childrenProp]: children.map((child: ITemplate) =>
            updateNode(child, id, updates),
          ),
        };
      }
      return root;
    },
    [],
  );

  const updateItem = useCallback(
    (id: string, updates: Partial<ITemplate>) => {
      setTemplate((prev) => prev.map((item) => updateNode(item, id, updates)));
    },
    [updateNode],
  );

  // Helper to add a node
  const addNode = useCallback(
    (
      root: ITemplate,
      parentId: string | null,
      newItem: ITemplate,
      index?: number,
    ): ITemplate => {
      if (root.id === parentId) {
        const config = BUILDER_TEMPLATES.find((t) => t.name === root.type);
        const childrenProp = config?.childrenProp || "templates";

        // @ts-ignore
        const currentChildren = root[childrenProp] || [];
        const newChildren = [...currentChildren];

        if (typeof index === "number" && index >= 0) {
          newChildren.splice(index, 0, newItem);
        } else {
          newChildren.push(newItem);
        }
        return { ...root, [childrenProp]: newChildren };
      }

      // Recursive search
      const config = BUILDER_TEMPLATES.find((t) => t.name === root.type);
      const childrenProp = config?.childrenProp || "templates";
      // @ts-ignore
      const children = root[childrenProp];

      if (children && Array.isArray(children)) {
        return {
          ...root,
          [childrenProp]: children.map((child: ITemplate) =>
            addNode(child, parentId, newItem, index),
          ),
        };
      }
      return root;
    },
    [],
  );

  const addItem = useCallback(
    (parentId: string | null, newItem: ITemplate, index?: number) => {
      // Recursively add IDs to new item and its children
      const addIds = (item: ITemplate, pId?: string | null): ITemplate => {
        const itemNew = { ...item, id: item.id || crypto.randomUUID() };

        if (pId) {
          const props = (itemNew.properties || {}) as any;
          itemNew.properties = { ...props, parentId: pId };
        }

        if (itemNew.templates) {
          itemNew.templates = itemNew.templates.map((child) =>
            addIds(child, itemNew.id),
          );
        }
        return itemNew;
      };

      const itemWithId = addIds(newItem, parentId);

      if (!parentId) {
        setTemplate((prev) => {
          const newTemplate = [...prev];
          if (typeof index === "number" && index >= 0) {
            newTemplate.splice(index, 0, itemWithId);
          } else {
            newTemplate.push(itemWithId);
          }
          return newTemplate;
        });
        return;
      }

      setTemplate((prev) =>
        prev.map((item) => addNode(item, parentId, itemWithId, index)),
      );
    },
    [addNode],
  );

  // Helper to remove a node
  const removeNode = useCallback(
    (root: ITemplate, id: string): ITemplate | null => {
      if (root.id === id) return null;

      const config = BUILDER_TEMPLATES.find((t) => t.name === root.type);
      const childrenProp = config?.childrenProp || "templates";
      // @ts-ignore
      const children = root[childrenProp];

      if (children && Array.isArray(children)) {
        const newChildren = children
          .map((child: ITemplate) => removeNode(child, id))
          .filter((child): child is ITemplate => child !== null);

        return { ...root, [childrenProp]: newChildren };
      }
      return root;
    },
    [],
  );

  const removeItem = useCallback(
    (id: string) => {
      setTemplate((prev) =>
        prev
          .map((item) => removeNode(item, id))
          .filter((item): item is ITemplate => item !== null),
      );
      if (selectedId === id) setSelectedId(null);
    },
    [removeNode, selectedId],
  );

  // Move item logic is complex, usually involves removing and adding.
  // For dnd-kit, we might use arrayMove for sorting within same container,
  // or move between containers.
  const moveItem = useCallback((dragId: string, hoverId: string) => {
      // Implementation depends on specific drag-drop logic (sortable vs tree)
      // We will implement a simplified version or leave it for the dnd-kit integration to handle
      // by calling removeItem then addItem.
      // But preserving the item's state is important.
      console.log("Move item", dragId, hoverId);
  }, []);

  return (
    <BuilderContext.Provider
      value={{
        template,
        setTemplate,
        selectedId,
        setSelectedId,
        updateItem,
        addItem,
        removeItem,
        moveItem,
        mockData,
        setMockData,
        highlightConfig,
        triggerHighlightConfig,
        viewMode,
        setViewMode,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
};
