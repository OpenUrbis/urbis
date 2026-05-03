import { AdminHeader } from "@/components/AdminHeader";
import { Form } from "@/components/ui/form";
import {
  createSearchConfig,
  getSearchConfigById,
  updateSearchConfig,
} from "@/integrations/search-integration";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/useToast";
import { BasicInfo } from "./steps/BasicInfo";
import { TransformParams } from "./steps/TransformParams";
import { TransformRequest } from "./steps/TransformRequest";
import { TransformResponse } from "./steps/TransformResponse";
import { SearchReview } from "./steps/SearchReview";
import { StepsNavigation } from "@/pages/Admin/components/StepsNavigation";
import {
  buildSearchSchema,
  parseSearchSchemaToForm,
  SearchSchemaFormSchema,
  SearchSchemaFormValues,
} from "./utils";
import { IGetSearchConfigResponse } from "@/types/fetch-search-config-type";

const SearchHandlePage = () => {
  const [isEditMatch, editParams] = useRoute("/:id");

  const isEditing = !!isEditMatch && editParams?.id !== "handle";
  const id = isEditing ? editParams?.id : undefined;

  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(isEditing ? 5 : 1);
  const [loading, setLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [originalData, setOriginalData] = useState<IGetSearchConfigResponse | null>(null);
  const [, setLocation] = useLocation();
  const { toastSuccess, toastError } = useToast();

  const form = useForm<SearchSchemaFormValues>({
    resolver: zodResolver(SearchSchemaFormSchema),
    defaultValues: {
      name: "",
      method: "GET",
      origin: "",
      layerId: "",
      isActive: true,
      clickAction: "none",
      transformParams: "",
      transformRequest: "",
      transformResponse: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    const loadData = async () => {
      if (isEditing && id) {
        setMaxReachedStep(5);
        try {
          const backendData = await getSearchConfigById(id);
          setOriginalData(backendData);

          const formData = parseSearchSchemaToForm(backendData);
          form.reset(formData);

          setIsDataLoaded(true);
        } catch (error) {
          console.error("Failed to load search config", error);
          toastError("Erro ao carregar configuração da pesquisa");
          setLocation("~/admin/search-manager");
        }
      }
    };

    loadData();
  }, [isEditing, id]);

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger([
        "name",
        "method",
        "origin",
        "layerId",
        "isActive",
        "clickAction",
      ]);
    } else if (step === 2) {
      isValid = await form.trigger(["transformParams"]);
    } else if (step === 3) {
      isValid = await form.trigger(["transformRequest"]);
    } else if (step === 4) {
      isValid = await form.trigger(["transformResponse"]);
    }

    if (isValid) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep > maxReachedStep) {
        setMaxReachedStep(nextStep);
      }
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const goToStep = async (targetStep: number) => {
    if (isEditing) {
      setStep(targetStep);
      return;
    }

    if (targetStep < step) {
      setStep(targetStep);
      return;
    }

    if (targetStep <= maxReachedStep) {
      setStep(targetStep);
    }
  };

  const onSubmit: SubmitHandler<SearchSchemaFormValues> = async (data) => {
    setLoading(true);
    try {
      const transformed = buildSearchSchema(data);

      if (isEditing && id && originalData) {
        const payload = {
          ...originalData,
          ...transformed,
        };
        await updateSearchConfig(id, payload);
        toastSuccess("Pesquisa atualizada com sucesso");
      } else {
        const techName = data.name;
        const generatedId = `${techName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}`;
        
        const payload = {
          ...transformed,
          id: generatedId,
        };

        await createSearchConfig(payload);
        toastSuccess("Pesquisa criada com sucesso");
      }

      setLocation("~/admin/search-manager");
    } catch (error) {
      console.error("Failed to save search", error);
      toastError("Erro ao salvar pesquisa");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: "Informações Básicas" },
    { number: 2, label: "Parâmetros" },
    { number: 3, label: "Requisição" },
    { number: 4, label: "Resposta" },
    { number: 5, label: "Revisão" },
  ];

  if (isEditing && !isDataLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-background/50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">
            Carregando dados da pesquisa...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background/50">
      <div className="px-6 py-4">
        <AdminHeader
          title={isEditing ? "Editar Pesquisa" : "Criar Pesquisa"}
          subtitle={
            isEditing
              ? `Editando: ${form.watch("name")}`
              : "Nova configuração de pesquisa"
          }
        />
      </div>

      <div className="flex-1 flex flex-col items-center px-0 md:px-6">
        <div className="w-full max-w-2xl space-y-12">
          <StepsNavigation
            steps={steps}
            currentStep={step}
            maxReachedStep={maxReachedStep}
            onStepClick={goToStep}
          />

          <div className="bg-card border md:rounded-lg p-6 shadow-sm mb-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {step === 1 && <BasicInfo onNext={handleNext} />}

                {step === 2 && (
                  <TransformParams onBack={handleBack} onNext={handleNext} />
                )}

                {step === 3 && (
                  <TransformRequest onBack={handleBack} onNext={handleNext} />
                )}

                {step === 4 && <TransformResponse onBack={handleBack} onNext={handleNext} />}
                
                {step === 5 && <SearchReview onBack={handleBack} />}
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHandlePage;
