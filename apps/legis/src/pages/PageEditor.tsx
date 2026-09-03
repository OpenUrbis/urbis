import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { usePage } from "../hooks/use-page";
import { PageForm } from "../components/page/PageForm";
import { CreatePageDto, Page } from "../types/page";
import { withElementAnchor } from "../lib/element-anchor";
import { Loader2 } from "lucide-react";
import { usePermission } from "../hooks/use-permission";

interface PageEditorProps {
  mode?: "create" | "edit";
}

export default function PageEditor({ mode = "create" }: PageEditorProps) {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/pages/:id/edit");
  const { getPage, createPage, updatePage, loading } = usePage();
  const { isAdmin, isLoading: permissionsLoading } = usePermission();
  const [initialData, setInitialData] = useState<Page | undefined>(undefined);
  const [initializing, setInitializing] = useState(mode === "edit");

  const loadData = useCallback(
    async (id: string) => {
      try {
        const page = await getPage(id);
        setInitialData(page);
      } catch (error) {
        console.error("Failed to load page", error);
        setLocation("/pages");
      } finally {
        setInitializing(false);
      }
    },
    [getPage, setLocation],
  );

  useEffect(() => {
    if (!permissionsLoading && !isAdmin) {
      setLocation("/pages");
      return;
    }

    if (mode === "edit" && params?.id) {
      void loadData(params.id);
    }
  }, [isAdmin, loadData, mode, params?.id, permissionsLoading, setLocation]);

  if (permissionsLoading || !isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getCancelLocation = () => {
    if (mode === "edit" && params?.id) {
      // Volta para a leitura no dispositivo em que a edição estava ancorada.
      return withElementAnchor(`/pages/${params.id}`, window.location.hash);
    }

    return "/pages";
  };

  const handleSubmit = async (data: CreatePageDto) => {
    if (mode === "edit" && params?.id) {
      return updatePage(params.id, data);
    }

    return createPage(data);
  };

  if (initializing) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageForm
      initialData={initialData}
      onSubmit={handleSubmit}
      cancelLocation={getCancelLocation()}
      loading={loading}
      title={mode === "create" ? "Criar Página" : "Editar Página"}
    />
  );
}
