import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  cn,
} from "@open-urbis/map-ui";
import {
  Plus,
  Trash2,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  X,
  Loader2,
  MousePointerClick,
  Edit,
  Upload,
  FileText,
  Paperclip,
} from "lucide-react";
import { parse, isAfter, isBefore } from "date-fns";
import {
  OriginalNormativo,
  Authority,
  EmentaAlteration,
} from "../../domain/entities";
import type { AnnotatedTextSegment } from "../../domain/types";
import { NORMATIVE_TYPES, NormativeTypeKey } from "../../data/normative-types";
import { SimpleEditor } from "../Editor/SimpleEditor";
import { uploadFileToS3, isImageUrl } from "../../services/file-service";
import { S3FilePickerModal } from "../common/S3FilePickerModal";
import { safeJSONParse } from "@/lib/content";
import {
  buildAnnotatedSegmentsExcerpt,
  htmlToPlainText,
} from "../../domain/text-utils";
import {
  getSegmentBaseText,
  withSegmentAnchor,
} from "../../domain/segment-anchor";
import { pageService } from "../../services/page-service";
import { authorityService } from "../../services/authority-service";
import { useInspectorTaskRequest } from "../inspector/inspector-task-context";
import { UserChip } from "../common/UserChip";
import type { LinkPickerSelection } from "../inspector/LinkPickerView";
import { NormativeLinkInput } from "../common/NormativeLinkInput";
import { DatePartsInput } from "../common/DatePartsInput";
import { ValidityInputFields } from "../common/ValidityInputFields";
import { ApiError } from "../../integrations/api-client";
import { toast } from "sonner";
import {
  createEmptyValidity,
  resolveLinkedElementDate,
  updateValidityNormativeElement,
} from "../../domain/validity";

/** Passage of an ementa alteration, as persisted. */
type AlterationSegment = AnnotatedTextSegment & { changedText?: string };

/**
 * The ementa is plain metadata, not a node of the editor, so no `normativeId`
 * matches it: the inspector degrades to selecting inside its own panel.
 */
const EMENTA_ELEMENT_ID = "metadata:ementa";

/** Passages of the source device, carrying the excerpt persisted as `changedText`. */
export function buildSourceSegments(
  baseText: string,
  segments: AnnotatedTextSegment[],
): AlterationSegment[] {
  return segments.map((segment) => {
    const anchored = withSegmentAnchor(baseText, segment);
    return {
      ...anchored,
      changedText: buildAnnotatedSegmentsExcerpt([anchored]),
    };
  });
}

/** Passages targeted in the ementa. */
export function buildTargetSegments(
  baseText: string,
  segments: AnnotatedTextSegment[],
): AnnotatedTextSegment[] {
  return segments.map((segment) => withSegmentAnchor(baseText, segment));
}

/** Label persisted for a link, from what the picker already resolved. */
export function buildLinkLabel(selection: LinkPickerSelection): string {
  return (
    [selection.documentLabel, selection.deviceLabel]
      .filter(Boolean)
      .join(" - ") || selection.elementId
  );
}

const formatAuthorityAuditValue = (value?: string) => {
  if (!value) return "—";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

// ==========================================
// Layout primitives
// ==========================================

/**
 * A section is announced by its heading and separated by a single hairline.
 * There is no filled panel: nesting boxes inside boxes made the form read as a
 * pile of cards instead of one document, and the fill carried no information.
 */
function FormSection({
  title,
  description,
  required,
  action,
  children,
}: {
  title: string;
  description?: string;
  required?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t pt-5 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-medium leading-none">
            {title}
            {required && <RequiredMark />}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Every field stacks the same way — label, control, then hint or error — so the
 * eye only has to learn one shape. The hint slot is reused by the error so the
 * layout does not jump when validation kicks in.
 */
function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="font-normal">
        {label}
        {required && <RequiredMark />}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * The asterisk is the whole signal, so it is hidden from assistive tech and the
 * obligation is carried by `aria-required` on the control itself — otherwise
 * every required label also read out a parenthetical.
 */
function RequiredMark() {
  return (
    <span aria-hidden="true" className="text-destructive">
      {" "}
      *
    </span>
  );
}

type OriginalValidity = NonNullable<OriginalNormativo["originalStartValidity"]>;

/**
 * Optional validity, shared by the start and the end so both behave alike.
 *
 * While empty the slot states what the absence means and offers "Adicionar";
 * once filled, "Remover" sits in the same place. The previous version floated a
 * round X over the corner of a filled panel, which read as a badge rather than
 * as the action it was.
 */
function ValiditySlot({
  label,
  emptyHint,
  value,
  onAdd,
  onRemove,
  onChange,
  onOpenLinkManager,
  linkLabel,
  disabled,
  isRequired = false,
  dateError,
  linkError,
}: {
  label: string;
  emptyHint: string;
  value?: OriginalValidity;
  onAdd?: () => void;
  onRemove?: () => void;
  onChange: (value: OriginalValidity) => void;
  onOpenLinkManager: () => void;
  linkLabel?: string;
  disabled?: boolean;
  isRequired?: boolean;
  dateError?: string;
  linkError?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="font-normal flex items-center gap-1">
          {label}
          {isRequired && <span className="text-destructive">*</span>}
        </Label>
        {!isRequired && value && onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs font-normal text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            disabled={disabled}
          >
            <X className="mr-1 h-3 w-3" /> Remover
          </Button>
        )}
        {!isRequired && !value && onAdd && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs font-normal"
            onClick={onAdd}
            disabled={disabled}
          >
            <Plus className="mr-1 h-3 w-3" /> Adicionar
          </Button>
        )}
      </div>

      {(value || isRequired) ? (
        <div className="space-y-1.5">
          <ValidityInputFields
            value={value || createEmptyValidity()}
            onChange={onChange}
            onOpenLinkManager={onOpenLinkManager}
            linkLabel={linkLabel}
            disabled={disabled}
          />
          {dateError && (
            <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {dateError}
            </p>
          )}
          {linkError && (
            <p className="text-[11px] font-medium text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {linkError}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyHint}</p>
      )}
    </div>
  );
}

// ==========================================
// Authority Dialog Component
// ==========================================

interface AuthorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authority?: Authority | null;
  mode: "create" | "edit";
  onSave: (authority: AuthorityDialogSubmitData) => Promise<void>;
  onDelete?: (authorityId: string) => Promise<void>;
  disabled?: boolean;
}

type AuthorityDialogSubmitData = {
  id?: string;
  commonRefFull: string;
  commonRefAbbr: string;
  complementFull?: string;
  complementAbbr?: string;
  startDate: string;
  endDate?: string;
  pageId?: string;
};

function AuthorityDialog({
  open,
  onOpenChange,
  authority,
  mode,
  onSave,
  onDelete,
  disabled,
}: AuthorityDialogProps) {
  const [formData, setFormData] = useState<Partial<Authority>>({
    startDate: "",
    commonRefFull: "",
    commonRefAbbr: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsSavingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    return (
      formData.commonRefFull && formData.commonRefAbbr && formData.startDate
    );
  }, [formData]);

  useEffect(() => {
    if (!open) return;

    setFormData(
      authority
        ? {
            id: authority.id,
            commonRefFull: authority.commonRefFull,
            commonRefAbbr: authority.commonRefAbbr,
            complementFull: authority.complementFull,
            complementAbbr: authority.complementAbbr,
            startDate: authority.startDate,
            endDate: authority.endDate,
            pageId: authority.pageId,
          }
        : {
            startDate: "",
            commonRefFull: "",
            commonRefAbbr: "",
          },
    );
    setIsSaving(false);
  }, [open, authority]);

  useEffect(() => {
    if (!open) {
      setFormData({ startDate: "", commonRefFull: "", commonRefAbbr: "" });
      setIsSaving(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!isValid) return;

    try {
      setIsSaving(true);
      await onSave({
        id: formData.id,
        commonRefFull: formData.commonRefFull!,
        commonRefAbbr: formData.commonRefAbbr!,
        complementFull: formData.complementFull,
        complementAbbr: formData.complementAbbr,
        startDate: formData.startDate!,
        endDate: formData.endDate,
        pageId: formData.pageId,
      });

      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Editar autoridade"
              : "Cadastrar nova autoridade"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-2">
          <Field
            label="Referência comum — por extenso"
            htmlFor="authority-common-ref-full"
            required
            className="col-span-2"
          >
            <Input
              id="authority-common-ref-full"
              aria-required="true"
              value={formData.commonRefFull || ""}
              onChange={(e) =>
                setFormData({ ...formData, commonRefFull: e.target.value })
              }
              placeholder="Ex: República Federativa do Brasil"
              disabled={disabled || isSaving}
            />
          </Field>

          <Field
            label="Referência comum — abreviação"
            htmlFor="authority-common-ref-abbr"
            required
          >
            <Input
              id="authority-common-ref-abbr"
              aria-required="true"
              value={formData.commonRefAbbr || ""}
              onChange={(e) =>
                setFormData({ ...formData, commonRefAbbr: e.target.value })
              }
              placeholder="Ex: Brasil"
              disabled={disabled || isSaving}
            />
          </Field>

          <Field
            label="Complemento — por extenso"
            htmlFor="authority-complement-full"
            className="col-span-2"
          >
            <Input
              id="authority-complement-full"
              value={formData.complementFull || ""}
              onChange={(e) =>
                setFormData({ ...formData, complementFull: e.target.value })
              }
              placeholder="Ex: Ministério da Fazenda"
              disabled={disabled || isSaving}
            />
          </Field>

          <Field
            label="Complemento — abreviação"
            htmlFor="authority-complement-abbr"
          >
            <Input
              id="authority-complement-abbr"
              value={formData.complementAbbr || ""}
              onChange={(e) =>
                setFormData({ ...formData, complementAbbr: e.target.value })
              }
              placeholder="Ex: MF"
              disabled={disabled || isSaving}
            />
          </Field>

          <Field label="ID da página (Legis)" htmlFor="authority-page-id">
            <Input
              id="authority-page-id"
              value={formData.pageId || ""}
              onChange={(e) =>
                setFormData({ ...formData, pageId: e.target.value })
              }
              placeholder="Opcional"
              disabled={disabled || isSaving}
            />
          </Field>

          <Field label="Data de início" required>
            <DatePartsInput
              value={formData.startDate}
              onChange={(v) => setFormData({ ...formData, startDate: v })}
              disabled={disabled || isSaving}
            />
          </Field>

          <Field
            label="Data de fim"
            hint="Deixe vazio se a autoridade segue vigente."
          >
            <DatePartsInput
              value={formData.endDate}
              onChange={(v) => setFormData({ ...formData, endDate: v })}
              disabled={disabled || isSaving}
            />
          </Field>

          {mode === "edit" && (
            <Field label="ID" hint="Gerado pelo sistema.">
              <p className="pt-2 font-mono text-xs text-muted-foreground">
                {authority?.id || "—"}
              </p>
            </Field>
          )}

          {authority && (
            <div className="col-span-2 space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Auditoria da autoridade persistida.
              </p>

              <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-xs md:grid-cols-2">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="text-muted-foreground">Criador:</span>
                  <UserChip
                    user={authority.createdByUser}
                    emptyLabel="—"
                    size="sm"
                    showProfileLink
                  />
                </div>
                <div>
                  <span className="text-muted-foreground">Criação:</span>{" "}
                  {formatAuthorityAuditValue(authority.createdAt)}
                </div>
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="text-muted-foreground">Últ. editor:</span>
                  <UserChip
                    user={authority.updatedByUser}
                    emptyLabel="—"
                    size="sm"
                    showProfileLink
                  />
                </div>
                <div>
                  <span className="text-muted-foreground">Últ. edição:</span>{" "}
                  {formatAuthorityAuditValue(authority.updatedAt)}
                </div>
              </div>
            </div>
          )}
        </div>

        {deleteError && (
          <div className="mx-6 mb-2 rounded border border-destructive/50 bg-destructive/10 p-2.5 text-xs text-destructive">
            {deleteError}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          {mode === "edit" && authority?.id && onDelete ? (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isSaving || isDeleting || disabled}
              onClick={async () => {
                if (!window.confirm("Deseja realmente excluir esta autoridade?")) {
                  return;
                }
                setDeleteError(null);
                setIsSavingDelete(true);
                try {
                  await onDelete(authority.id);
                  onOpenChange(false);
                } catch (err: any) {
                  setDeleteError(
                    err?.message ||
                      "Não foi possível excluir esta autoridade pois existem vínculos ativos.",
                  );
                } finally {
                  setIsSavingDelete(false);
                }
              }}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Excluir autoridade
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleSubmit()}
              disabled={!isValid || disabled || isSaving || isDeleting}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {mode === "edit" ? "Salvar alterações" : "Salvar autoridade"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// Main Form Component
// ==========================================

interface NormativeMetadataFormProps {
  data: Partial<OriginalNormativo>;
  onChange: (data: Partial<OriginalNormativo>) => void;
  disabled?: boolean;
}

type LinkTarget =
  | { type: "alteration"; index: number }
  | { type: "startValidity" }
  | { type: "endValidity" };

/**
 * The title is not edited here: `PageForm` already owns it as the heading of the
 * document, and repeating the field inside the metadata sheet meant the same
 * value (and the same hint) showed up twice on one screen.
 */
export function NormativeMetadataForm({
  data,
  onChange,
  disabled,
}: NormativeMetadataFormProps) {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [authorityDialogMode, setAuthorityDialogMode] = useState<
    "create" | "edit"
  >("create");
  const [editingAuthority, setEditingAuthority] = useState<Authority | null>(
    null,
  );
  const [isLoadingAuthorities, setIsLoadingAuthorities] = useState(false);
  const [isCreatingAuthority, setIsCreatingAuthority] = useState(false);
  const [isUpdatingAuthority, setIsUpdatingAuthority] = useState(false);
  const [authoritiesError, setAuthoritiesError] = useState<string | null>(null);

  const { request: requestInspectorTask } = useInspectorTaskRequest();

  /**
   * The inspector is not blocking, so the form stays editable while a step is
   * pending: resolving must merge into the current data, not into whatever was
   * on screen when the step was requested.
   */
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const [loadingText, setLoadingText] = useState(false);
  const [linkCache, setLinkCache] = useState<Record<string, { label: string }>>(
    {},
  );

  // Derived State
  const selectedAuthority = authorities.find((a) => a.id === data.authorityId);

  // Validation Logic
  const isDateValidForAuthority = useMemo(() => {
    if (!data.actDate || !selectedAuthority) return true;

    try {
      const actDate = parse(data.actDate, "dd.MM.yyyy", new Date());
      const authStart = parse(
        selectedAuthority.startDate,
        "dd.MM.yyyy",
        new Date(),
      );

      if (isBefore(actDate, authStart)) return false;

      if (selectedAuthority.endDate) {
        const authEnd = parse(
          selectedAuthority.endDate,
          "dd.MM.yyyy",
          new Date(),
        );
        if (isAfter(actDate, authEnd)) return false;
      }

      return true;
    } catch {
      return false;
    }
  }, [data.actDate, selectedAuthority]);

  const hasMinimumDocumentIdentification = useMemo(() => {
    return !!(data.number || data.actDate || data.publicationDate);
  }, [data.number, data.actDate, data.publicationDate]);

  const hasSelectedAuthority = useMemo(() => {
    return !!data.authorityId?.trim();
  }, [data.authorityId]);

  const hasNormativeType = useMemo(() => {
    return !!data.normativeType?.trim();
  }, [data.normativeType]);

  const loadAuthorities = useCallback(async () => {
    setIsLoadingAuthorities(true);
    setAuthoritiesError(null);

    try {
      const loadedAuthorities = await authorityService.list();
      setAuthorities(loadedAuthorities);
    } catch (error) {
      console.error(error);
      setAuthoritiesError("Não foi possível carregar as autoridades.");
    } finally {
      setIsLoadingAuthorities(false);
    }
  }, []);

  useEffect(() => {
    void loadAuthorities();
  }, [loadAuthorities]);

  // Handlers
  const sortAuthorities = useCallback((items: Authority[]) => {
    return [...items].sort((left, right) => {
      const leftLabel =
        `${left.commonRefAbbr} ${left.complementAbbr || ""} ${left.commonRefFull}`.trim();
      const rightLabel =
        `${right.commonRefAbbr} ${right.complementAbbr || ""} ${right.commonRefFull}`.trim();
      return leftLabel.localeCompare(rightLabel, "pt-BR");
    });
  }, []);

  const handleCreateAuthority = useCallback(
    async (newAuth: AuthorityDialogSubmitData) => {
      setIsCreatingAuthority(true);

      try {
        const createdAuthority = await authorityService.create(newAuth);

        setAuthorities((current) =>
          sortAuthorities([...current, createdAuthority]),
        );

        onChange({ ...data, authorityId: createdAuthority.id });
        toast.success("Autoridade cadastrada com sucesso.");
      } catch (error) {
        console.error(error);

        if (error instanceof ApiError && error.status === 403) {
          toast.error("Você não tem permissão para cadastrar autoridades.");
          return;
        }

        toast.error("Não foi possível cadastrar a autoridade.");
        throw error;
      } finally {
        setIsCreatingAuthority(false);
      }
    },
    [data, onChange, sortAuthorities],
  );

  const handleEditAuthority = useCallback(
    async (authorityData: AuthorityDialogSubmitData) => {
      if (!authorityData.id) {
        toast.error("Não foi possível identificar a autoridade para edição.");
        return;
      }

      setIsUpdatingAuthority(true);

      try {
        const updatedAuthority = await authorityService.update(
          authorityData.id,
          {
            commonRefFull: authorityData.commonRefFull,
            commonRefAbbr: authorityData.commonRefAbbr,
            complementFull: authorityData.complementFull,
            complementAbbr: authorityData.complementAbbr,
            startDate: authorityData.startDate,
            endDate: authorityData.endDate,
            pageId: authorityData.pageId,
          },
        );

        setAuthorities((current) =>
          sortAuthorities(
            current.map((authority) =>
              authority.id === updatedAuthority.id
                ? updatedAuthority
                : authority,
            ),
          ),
        );

        if (data.authorityId === updatedAuthority.id) {
          onChange({ ...data, authorityId: updatedAuthority.id });
        }

        setEditingAuthority(updatedAuthority);
        toast.success("Autoridade atualizada com sucesso.");
      } catch (error) {
        console.error(error);

        if (error instanceof ApiError && error.status === 403) {
          toast.error("Você não tem permissão para editar autoridades.");
          return;
        }

        toast.error("Não foi possível atualizar a autoridade.");
        throw error;
      } finally {
        setIsUpdatingAuthority(false);
      }
    },
    [data, onChange, sortAuthorities],
  );

  const handleSaveAuthority = useCallback(
    async (authorityData: AuthorityDialogSubmitData) => {
      if (authorityDialogMode === "edit") {
        await handleEditAuthority(authorityData);
        return;
      }

      await handleCreateAuthority(authorityData);
    },
    [authorityDialogMode, handleCreateAuthority, handleEditAuthority],
  );

  const openCreateAuthorityDialog = useCallback(() => {
    setAuthorityDialogMode("create");
    setEditingAuthority(null);
    setAuthDialogOpen(true);
  }, []);

  const openEditAuthorityDialog = useCallback(() => {
    if (!selectedAuthority) {
      toast.error("Selecione uma autoridade para editar.");
      return;
    }

    setAuthorityDialogMode("edit");
    setEditingAuthority(selectedAuthority);
    setAuthDialogOpen(true);
  }, [selectedAuthority]);

  const handleAddAlteration = () => {
    const newAlt: EmentaAlteration = {
      type: "Alteração de ementa",
      device: "",
      normativeElementId: "",
      targetSegments: [],
    };
    onChange({
      ...data,
      ementaAlterations: [...(data.ementaAlterations || []), newAlt],
    });
  };

  const handleRemoveAlteration = (index: number) => {
    const newAlts = [...(data.ementaAlterations || [])];
    newAlts.splice(index, 1);
    onChange({ ...data, ementaAlterations: newAlts });
  };

  const handleUpdateAlteration = (
    index: number,
    field: keyof EmentaAlteration,
    value: any,
  ) => {
    const current = dataRef.current;
    const newAlts = [...(current.ementaAlterations || [])];
    newAlts[index] = { ...newAlts[index], [field]: value };
    onChange({ ...current, ementaAlterations: newAlts });
  };

  const handleAddSource = () => {
    onChange({
      ...data,
      sources: [...(data.sources || []), { url: "", name: "" }],
    });
  };

  const handleUpdateSource = (
    index: number,
    field: "url" | "name",
    value: string,
  ) => {
    const newSources = [...(data.sources || [])];
    newSources[index] = { ...newSources[index], [field]: value };
    onChange({ ...data, sources: newSources });
  };

  const handleRemoveSource = (index: number) => {
    const newSources = [...(data.sources || [])];
    newSources.splice(index, 1);
    onChange({ ...data, sources: newSources });
  };

  const sourceFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingSourceIndex, setUploadingSourceIndex] = useState<number | null>(null);
  const [isUploadingSource, setIsUploadingSource] = useState(false);

  const [isS3ModalOpen, setIsS3ModalOpen] = useState(false);
  const [s3ModalTargetIndex, setS3ModalTargetIndex] = useState<number | null>(null);

  const handleUploadSourceFile = async (
    event: React.ChangeEvent<HTMLInputElement>,
    targetIndex?: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (targetIndex !== undefined) {
      setUploadingSourceIndex(targetIndex);
    } else {
      setIsUploadingSource(true);
    }

    try {
      const result = await uploadFileToS3(file, "legis/fontes");
      if (targetIndex !== undefined) {
        const newSources = [...(data.sources || [])];
        const existingName = newSources[targetIndex]?.name;
        newSources[targetIndex] = {
          url: result.url,
          name: existingName || result.name,
        };
        onChange({ ...data, sources: newSources });
      } else {
        onChange({
          ...data,
          sources: [
            ...(data.sources || []),
            { url: result.url, name: result.name },
          ],
        });
      }
    } catch (err: any) {
      alert(err?.message || "Erro ao enviar arquivo para o S3.");
    } finally {
      setUploadingSourceIndex(null);
      setIsUploadingSource(false);
      event.target.value = "";
    }
  };

  const currentLinkedElementId = (target: LinkTarget) => {
    const current = dataRef.current;

    if (target.type === "alteration") {
      return current.ementaAlterations?.[target.index]?.normativeElementId;
    }

    return target.type === "startValidity"
      ? current.originalStartValidity?.normativeElementId
      : current.originalEndValidity?.normativeElementId;
  };

  const requestLink = (target: LinkTarget) => {
    requestInspectorTask({
      kind: "link",
      title: "Vincular dispositivo de origem",
      localElements: data.elements,
      initialSelection: {
        elementId: currentLinkedElementId(target) || undefined,
      },
      onResolve: (selection) => {
        const label = buildLinkLabel(selection);
        setLinkCache((prev) => ({ ...prev, [selection.elementId]: { label } }));

        if (target.type === "alteration") {
          handleUpdateAlteration(
            target.index,
            "normativeElementId",
            selection.elementId,
          );
          return;
        }

        const current = dataRef.current;
        const linkedDate =
          resolveLinkedElementDate(selection.document, selection.elementId) ||
          current.originalStartValidity?.date ||
          data.actDate ||
          data.publicationDate ||
          "";

        if (target.type === "startValidity") {
          onChange({
            ...current,
            originalStartValidity: updateValidityNormativeElement(
              current.originalStartValidity,
              selection.elementId,
              label,
              linkedDate,
            ),
          });
          return;
        }

        onChange({
          ...current,
          originalEndValidity: updateValidityNormativeElement(
            current.originalEndValidity,
            selection.elementId,
            label,
            linkedDate,
          ),
        });
      },
    });
  };

  const handleOpenSourceSegments = async (index: number) => {
    const alt = data.ementaAlterations?.[index];
    if (!alt || !alt.normativeElementId) {
      alert("Preencha o ID do Elemento Normativo primeiro.");
      return;
    }

    setLoadingText(true);
    try {
      // There is no endpoint to fetch an element by id, so the element is
      // looked up in the pages already available.
      const allPages = await pageService.getAll();
      let baseText = "";
      let elementLabel = alt.device || "Dispositivo de origem";

      for (const page of allPages) {
        if (page.type === "original_normativo" && page.entity) {
          const norm = page.entity as OriginalNormativo;
          const el = norm.elements.find((e) => e.id === alt.normativeElementId);
          if (el) {
            baseText = getSegmentBaseText(el);
            elementLabel =
              [el.type, el.index].filter(Boolean).join(" ").trim() ||
              elementLabel;
            break;
          }
        }
      }

      if (!baseText) {
        alert("Elemento não encontrado no sistema. Verifique o ID.");
        return;
      }

      requestInspectorTask({
        kind: "trechos",
        title: "Trechos da nova redação",
        baseText,
        elementId: alt.normativeElementId,
        elementLabel,
        situationType: "Nova redação",
        segments:
          dataRef.current.ementaAlterations?.[index]?.sourceSegments || [],
        onResolve: (segments) => {
          handleUpdateAlteration(
            index,
            "sourceSegments",
            buildSourceSegments(baseText, segments),
          );
        },
      });
    } catch (e) {
      console.error(e);
      alert("Erro ao Pesquisar texto do elemento.");
    } finally {
      setLoadingText(false);
    }
  };

  const handleOpenTargetSegments = (index: number) => {
    const baseText = htmlToPlainText(data.ementa || "").trim();
    if (!baseText) {
      alert("Preencha a Ementa primeiro.");
      return;
    }

    requestInspectorTask({
      kind: "trechos",
      title: "Trechos a substituir",
      baseText,
      elementId: EMENTA_ELEMENT_ID,
      elementLabel: "Ementa",
      situationType: "Alteração de ementa",
      segments: data.ementaAlterations?.[index]?.targetSegments || [],
      onResolve: (segments) => {
        handleUpdateAlteration(
          index,
          "targetSegments",
          buildTargetSegments(baseText, segments),
        );
      },
    });
  };

  return (
    <div className="space-y-5 pb-6">
      {(!hasNormativeType ||
        !hasMinimumDocumentIdentification ||
        !hasSelectedAuthority) && (
        <p
          className="flex items-start gap-2 border-l-2 border-destructive pl-3 text-sm text-destructive"
          role="status"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Para salvar o original normativo, selecione um tipo normativo,
            preencha pelo menos um dos campos Número, Data do ato ou Data de
            publicação e selecione uma autoridade.
          </span>
        </p>
      )}

      <FormSection
        title="Identificação"
        description="Preencha ao menos o número ou uma das datas."
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <Field
            label="Tipo normativo"
            required
            hint="Campo de preenchimento obrigatório."
            error={
              !hasNormativeType
                ? "O campo Tipo normativo é obrigatório. Selecione um tipo normativo."
                : undefined
            }
          >
            <Select
              value={data.normativeType}
              onValueChange={(v) =>
                onChange({ ...data, normativeType: v as NormativeTypeKey })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(NORMATIVE_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label} ({key})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Número da norma"
            htmlFor="normative-number"
            hint="Pode conter pontuação e letras."
          >
            <Input
              id="normative-number"
              value={data.number || ""}
              onChange={(e) => onChange({ ...data, number: e.target.value })}
              placeholder="Ex: 12.345-A"
              disabled={disabled}
            />
          </Field>

          <Field
            label="Data do ato"
            error={
              isDateValidForAuthority
                ? undefined
                : "Data incompatível com a vigência da autoridade selecionada."
            }
          >
            <DatePartsInput
              value={data.actDate}
              onChange={(v) => {
                const currentStart = data.originalStartValidity || createEmptyValidity();
                const updatedStartDate = currentStart.date?.trim() ? currentStart.date : (data.publicationDate || v || "");
                onChange({
                  ...data,
                  actDate: v,
                  originalStartValidity: {
                    ...currentStart,
                    date: updatedStartDate,
                  },
                });
              }}
              maxYear={new Date().getFullYear() + 1}
              disabled={disabled}
            />
          </Field>

          <Field label="Data de publicação">
            <DatePartsInput
              value={data.publicationDate}
              onChange={(v) => {
                const currentStart = data.originalStartValidity || createEmptyValidity();
                const updatedStartDate = currentStart.date?.trim() ? currentStart.date : (v || data.actDate || "");
                onChange({
                  ...data,
                  publicationDate: v,
                  originalStartValidity: {
                    ...currentStart,
                    date: updatedStartDate,
                  },
                });
              }}
              maxYear={new Date().getFullYear()}
              disabled={disabled}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Vigência do original"
        description="Elementos com vigência própria prevalecem."
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <ValiditySlot
            label="Vigência inicial"
            emptyHint="Defina a data e vincule o elemento normativo."
            value={data.originalStartValidity || createEmptyValidity()}
            isRequired
            dateError={
              !data.originalStartValidity?.date?.trim()
                ? "Data de vigência inicial é obrigatória."
                : undefined
            }
            linkError={
              !data.originalStartValidity?.normativeElementId?.trim()
                ? "A vigência inicial precisa estar vinculada a um elemento normativo."
                : undefined
            }
            onChange={(originalStartValidity) =>
              onChange({ ...data, originalStartValidity })
            }
            onOpenLinkManager={() => requestLink({ type: "startValidity" })}
            linkLabel={
              data.originalStartValidity?.normativeElementId
                ? linkCache[data.originalStartValidity.normativeElementId]
                    ?.label
                : undefined
            }
            disabled={disabled}
          />

          <ValiditySlot
            label="Vigência final"
            emptyHint="Sem vigência final: a norma segue vigente."
            value={data.originalEndValidity}
            onAdd={() =>
              onChange({ ...data, originalEndValidity: createEmptyValidity() })
            }
            onRemove={() =>
              onChange({ ...data, originalEndValidity: undefined })
            }
            onChange={(originalEndValidity) =>
              onChange({ ...data, originalEndValidity })
            }
            onOpenLinkManager={() => requestLink({ type: "endValidity" })}
            linkLabel={
              data.originalEndValidity?.normativeElementId
                ? linkCache[data.originalEndValidity.normativeElementId]?.label
                : undefined
            }
            disabled={disabled}
          />
        </div>
      </FormSection>

      <FormSection
        title="Autoridade"
        required
        action={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-normal"
              onClick={openCreateAuthorityDialog}
              disabled={disabled || isCreatingAuthority || isUpdatingAuthority}
            >
              <PlusCircle className="mr-1 h-3 w-3" /> Nova
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-normal"
              onClick={openEditAuthorityDialog}
              disabled={
                disabled ||
                !selectedAuthority ||
                isCreatingAuthority ||
                isUpdatingAuthority
              }
            >
              <Edit className="mr-1 h-3 w-3" /> Editar
            </Button>
          </div>
        }
      >
        <div className="space-y-1.5">
          <Select
            value={data.authorityId}
            onValueChange={(v) => onChange({ ...data, authorityId: v })}
            disabled={disabled || isLoadingAuthorities}
          >
            {/*
                          The trigger renders its own single line instead of
                          `SelectValue`, which would echo the whole multi-line
                          body of the chosen item into the closed control.
                        */}
            <SelectTrigger aria-label="Autoridade" aria-required="true">
              {selectedAuthority ? (
                <span className="min-w-0 truncate text-left">
                  {selectedAuthority.commonRefAbbr}
                  {selectedAuthority.complementAbbr
                    ? ` · ${selectedAuthority.complementAbbr}`
                    : ""}
                  <span className="text-muted-foreground">
                    {" — "}
                    {selectedAuthority.complementFull ||
                      selectedAuthority.commonRefFull}
                  </span>
                </span>
              ) : (
                <SelectValue
                  placeholder={
                    isLoadingAuthorities
                      ? "Carregando autoridades..."
                      : "Selecione a autoridade..."
                  }
                />
              )}
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {authorities.map((auth) => (
                <SelectItem key={auth.id} value={auth.id}>
                  <div className="flex max-w-[520px] flex-col py-0.5 leading-snug">
                    <span>
                      {auth.commonRefAbbr}
                      {auth.complementAbbr ? ` · ${auth.complementAbbr}` : ""}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {auth.commonRefFull}
                      {auth.complementFull ? ` — ${auth.complementFull}` : ""}
                      {" · "}
                      {auth.startDate} até {auth.endDate || "presente"}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!hasSelectedAuthority && !authoritiesError && (
            <p className="text-xs text-destructive">
              Selecione uma autoridade para permitir o salvamento.
            </p>
          )}
        </div>

        {authoritiesError && (
          <div className="flex items-center justify-between gap-3 border-l-2 border-destructive pl-3 text-xs text-destructive">
            <span>{authoritiesError}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 font-normal"
              onClick={() => void loadAuthorities()}
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/*
                  Only what the closed trigger does not already say. The audit
                  trail (creator, timestamps) lives in the "Editar" dialog: on
                  this screen it repeated four rows nobody fills in.
                */}
        {selectedAuthority && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="inline">Referência: </dt>
              <dd className="inline text-foreground">
                {selectedAuthority.commonRefFull}
              </dd>
            </div>
            <div>
              <dt className="inline">Vigência: </dt>
              <dd className="inline text-foreground">
                {selectedAuthority.startDate} até{" "}
                {selectedAuthority.endDate || "presente"}
              </dd>
            </div>
            <div>
              <dt className="inline">ID: </dt>
              <dd className="inline font-mono text-foreground">
                {selectedAuthority.id}
              </dd>
            </div>
            {selectedAuthority.pageId && (
              <div>
                <dt className="inline">Página vinculada: </dt>
                <dd className="inline">
                  <a
                    href={`/pages/${selectedAuthority.pageId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-foreground hover:underline"
                  >
                    {selectedAuthority.pageId}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        )}
      </FormSection>

      <FormSection title="Ementa" required>
        <Textarea
          id="normative-ementa"
          aria-label="Ementa"
          aria-required="true"
          value={data.ementa || ""}
          onChange={(e) => onChange({ ...data, ementa: e.target.value })}
          className="min-h-[80px]"
          placeholder="Dispõe sobre..."
          disabled={disabled}
        />
      </FormSection>

      <FormSection
        title="Alterações de ementa"
        action={
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs font-normal"
            onClick={handleAddAlteration}
          >
            <Plus className="mr-1 h-3 w-3" /> Adicionar alteração
          </Button>
        }
      >
        {!data.ementaAlterations?.length && (
          <p className="text-xs text-muted-foreground">
            Nenhuma alteração cadastrada.
          </p>
        )}

        {data.ementaAlterations?.map((alt, index) => (
          <div key={index} className="space-y-3 border-t pt-3 first:border-t-0">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Alteração {index + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-1.5 text-xs font-normal text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveAlteration(index)}
              >
                <Trash2 className="mr-1 h-3 w-3" /> Remover
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
              <Field
                label="Dispositivo"
                htmlFor={`alteration-device-${index}`}
                required
              >
                <Input
                  id={`alteration-device-${index}`}
                  aria-required="true"
                  value={alt.device}
                  onChange={(e) =>
                    handleUpdateAlteration(index, "device", e.target.value)
                  }
                  placeholder="Ex: Art. 1º"
                  className="h-8"
                />
              </Field>
              <Field label="Elemento normativo vinculado" required>
                <NormativeLinkInput
                  value={alt.normativeElementId || ""}
                  onChange={(val) =>
                    handleUpdateAlteration(index, "normativeElementId", val)
                  }
                  onOpen={() => requestLink({ type: "alteration", index })}
                  label={
                    alt.normativeElementId
                      ? linkCache[alt.normativeElementId]?.label
                      : undefined
                  }
                  placeholder="Vincular elemento"
                />
              </Field>
            </div>

            {/* Source Segments (Trechos com Texto Alterado) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="font-normal">
                  Trechos do texto alterado{" "}
                  <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs font-normal"
                    onClick={() => handleOpenSourceSegments(index)}
                    disabled={loadingText}
                  >
                    {loadingText ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <MousePointerClick className="mr-1 h-3 w-3" />
                    )}
                    Selecionar da fonte
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs font-normal"
                    onClick={() => {
                      const newSegs = [
                        ...(alt.sourceSegments || []),
                        { start: 0, end: 0, changedText: "" },
                      ];
                      handleUpdateAlteration(index, "sourceSegments", newSegs);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Manual
                  </Button>
                </div>
              </div>
              {alt.sourceSegments?.map((seg: any, sIdx: number) => (
                <div
                  key={sIdx}
                  className="grid grid-cols-[1fr_80px_80px_24px] items-start gap-2"
                >
                  <Input
                    value={seg.changedText || ""}
                    onChange={(e) => {
                      const newSegs = [...(alt.sourceSegments || [])];
                      newSegs[sIdx] = { ...seg, changedText: e.target.value };
                      handleUpdateAlteration(index, "sourceSegments", newSegs);
                    }}
                    placeholder="Texto alterado"
                    className="h-7 text-xs"
                    aria-label={`Texto alterado do trecho ${sIdx + 1}`}
                  />
                  <Input
                    type="number"
                    value={seg.start}
                    onChange={(e) => {
                      const newSegs = [...(alt.sourceSegments || [])];
                      newSegs[sIdx] = {
                        ...seg,
                        start: parseInt(e.target.value) || 0,
                      };
                      handleUpdateAlteration(index, "sourceSegments", newSegs);
                    }}
                    placeholder="Início"
                    className="h-7 text-xs"
                    aria-label={`Início do trecho ${sIdx + 1}`}
                  />
                  <Input
                    type="number"
                    value={seg.end}
                    onChange={(e) => {
                      const newSegs = [...(alt.sourceSegments || [])];
                      newSegs[sIdx] = {
                        ...seg,
                        end: parseInt(e.target.value) || 0,
                      };
                      handleUpdateAlteration(index, "sourceSegments", newSegs);
                    }}
                    placeholder="Fim"
                    className="h-7 text-xs"
                    aria-label={`Fim do trecho ${sIdx + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const newSegs = [...(alt.sourceSegments || [])];
                      newSegs.splice(sIdx, 1);
                      handleUpdateAlteration(index, "sourceSegments", newSegs);
                    }}
                    title="Remover trecho"
                    aria-label="Remover trecho"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Target Segments (Trechos Alvo) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="font-normal">
                  Trechos alvo na ementa
                  <RequiredMark />
                </Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs font-normal"
                    onClick={() => handleOpenTargetSegments(index)}
                  >
                    <MousePointerClick className="mr-1 h-3 w-3" /> Selecionar na
                    ementa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-xs font-normal"
                    onClick={() => {
                      const newSegs = [
                        ...(alt.targetSegments || []),
                        { start: 0, end: 0 },
                      ];
                      handleUpdateAlteration(index, "targetSegments", newSegs);
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Manual
                  </Button>
                </div>
              </div>
              {alt.targetSegments?.map((seg, tIdx) => (
                <div
                  key={tIdx}
                  className="grid grid-cols-[1fr_1fr_24px] items-center gap-2"
                >
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`target-start-${index}-${tIdx}`}
                      className="w-10 text-xs font-normal text-muted-foreground"
                    >
                      Início
                    </Label>
                    <Input
                      id={`target-start-${index}-${tIdx}`}
                      type="number"
                      value={seg.start}
                      onChange={(e) => {
                        const newSegs = [...(alt.targetSegments || [])];
                        newSegs[tIdx] = {
                          ...seg,
                          start: parseInt(e.target.value) || 0,
                        };
                        handleUpdateAlteration(
                          index,
                          "targetSegments",
                          newSegs,
                        );
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`target-end-${index}-${tIdx}`}
                      className="w-10 text-xs font-normal text-muted-foreground"
                    >
                      Fim
                    </Label>
                    <Input
                      id={`target-end-${index}-${tIdx}`}
                      type="number"
                      value={seg.end}
                      onChange={(e) => {
                        const newSegs = [...(alt.targetSegments || [])];
                        newSegs[tIdx] = {
                          ...seg,
                          end: parseInt(e.target.value) || 0,
                        };
                        handleUpdateAlteration(
                          index,
                          "targetSegments",
                          newSegs,
                        );
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const newSegs = [...(alt.targetSegments || [])];
                      newSegs.splice(tIdx, 1);
                      handleUpdateAlteration(index, "targetSegments", newSegs);
                    }}
                    title="Remover trecho"
                    aria-label="Remover trecho"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {(!alt.targetSegments || alt.targetSegments.length === 0) && (
                <p className="text-xs text-destructive">
                  Nenhum trecho alvo definido.
                </p>
              )}
            </div>
          </div>
        ))}
      </FormSection>

      <FormSection
        title="Preâmbulo e assinatura"
        description="Fora da estrutura de dispositivos."
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <Field label="Preâmbulo">
            <SimpleEditor
              key={data.id ? `preamble-${data.id}` : "preamble-new"}
              initialContent={
                data.preamble
                  ? data.preamble.startsWith("{")
                    ? safeJSONParse(data.preamble) || data.preamble
                    : data.preamble
                  : undefined
              }
              onChange={(content) => onChange({ ...data, preamble: content })}
              readOnly={disabled}
              className="prose-sm"
              placeholder="O Presidente da República..."
              outputFormat="html"
            />
          </Field>
          <Field label="Assinatura">
            <SimpleEditor
              key={data.id ? `signature-${data.id}` : "signature-new"}
              initialContent={
                data.signature
                  ? data.signature.startsWith("{")
                    ? safeJSONParse(data.signature) || data.signature
                    : data.signature
                  : undefined
              }
              onChange={(content) => onChange({ ...data, signature: content })}
              readOnly={disabled}
              className="prose-sm text-right"
              placeholder="Nome do signatário..."
              outputFormat="html"
            />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Fontes e Anexos"
        description="URLs externas ou arquivos enviados para o S3."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-normal"
              onClick={() => {
                setS3ModalTargetIndex(null);
                setIsS3ModalOpen(true);
              }}
            >
              <Upload className="mr-1 h-3 w-3" /> Upload S3 / Recentes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs font-normal"
              onClick={handleAddSource}
            >
              <Plus className="mr-1 h-3 w-3" /> Adicionar fonte
            </Button>
          </div>
        }
      >
        <S3FilePickerModal
          open={isS3ModalOpen}
          onOpenChange={setIsS3ModalOpen}
          onSelect={(result) => {
            if (s3ModalTargetIndex !== null) {
              const newSources = [...(data.sources || [])];
              const existingName = newSources[s3ModalTargetIndex]?.name;
              newSources[s3ModalTargetIndex] = {
                url: result.url,
                name: existingName || result.name,
              };
              onChange({ ...data, sources: newSources });
            } else {
              onChange({
                ...data,
                sources: [
                  ...(data.sources || []),
                  { url: result.url, name: result.name },
                ],
              });
            }
          }}
          folderPath="legis/fontes"
        />
        {data.sources?.map((source, index) => {
          const isImg = isImageUrl(source.url || source.name);

          return (
            <div
              key={index}
              className="space-y-1.5 rounded-md border p-2 bg-muted/20"
            >
              <div className="flex items-center gap-2">
                <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-2">
                  <Input
                    value={source.url}
                    onChange={(e) =>
                      handleUpdateSource(index, "url", e.target.value)
                    }
                    placeholder="URL ou link do arquivo"
                    className="h-8 text-xs"
                    aria-label={`URL da fonte ${index + 1}`}
                  />
                  <Input
                    value={source.name || ""}
                    onChange={(e) =>
                      handleUpdateSource(index, "name", e.target.value)
                    }
                    placeholder="Nome da fonte / arquivo (opcional)"
                    className="h-8 text-xs"
                    aria-label={`Nome da fonte ${index + 1}`}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs font-normal shrink-0"
                  onClick={() => {
                    setS3ModalTargetIndex(index);
                    setIsS3ModalOpen(true);
                  }}
                  title="Upload S3 ou escolher recente para esta fonte"
                >
                  <Upload className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleRemoveSource(index)}
                  title="Remover fonte"
                  aria-label="Remover fonte"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {source.url && (
                <div className="mt-1">
                  {isImg ? (
                    <div className="flex items-center gap-2 rounded border bg-background p-1.5 max-w-xs">
                      <img
                        src={source.url}
                        alt={source.name || "Imagem da fonte"}
                        className="h-12 w-12 object-cover rounded"
                      />
                      <div className="min-w-0 flex-1 text-xs">
                        <span className="font-medium truncate block">
                          {source.name || "Imagem"}
                        </span>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline text-[11px] inline-flex items-center gap-1"
                        >
                          Abrir <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded border bg-background px-2.5 py-1 text-xs">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium truncate max-w-[220px]">
                        {source.name || source.url}
                      </span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-[11px] ml-1 shrink-0 inline-flex items-center gap-1"
                      >
                        Abrir <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {(!data.sources || data.sources.length === 0) && (
          <p className="text-xs text-muted-foreground">
            Nenhuma fonte cadastrada. Use "Upload S3" ou "Adicionar fonte" para incluir.
          </p>
        )}
      </FormSection>

      <AuthorityDialog
        open={isAuthDialogOpen}
        onOpenChange={(open) => {
          setAuthDialogOpen(open);
          if (!open) {
            setEditingAuthority(null);
            setAuthorityDialogMode("create");
          }
        }}
        authority={editingAuthority}
        mode={authorityDialogMode}
        onSave={handleSaveAuthority}
        disabled={disabled || isCreatingAuthority || isUpdatingAuthority}
      />
    </div>
  );
}
