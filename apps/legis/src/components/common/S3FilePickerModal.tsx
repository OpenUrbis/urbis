import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Badge,
  cn,
} from "@open-urbis/map-ui";
import {
  Upload,
  FileText,
  Paperclip,
  AlertTriangle,
  Search,
  Trash2,
  Loader2,
  Clock,
  Image as ImageIcon,
} from "lucide-react";
import {
  uploadFileToS3,
  getRecentS3Uploads,
  removeRecentS3Upload,
  isImageUrl,
  type RecentS3Upload,
} from "../../services/file-service";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface S3FilePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: { url: string; name: string; key?: string }) => void;
  folderPath?: string;
  title?: string;
}

export function S3FilePickerModal({
  open,
  onOpenChange,
  onSelect,
  folderPath = "legis/fontes",
  title = "Upload de Arquivo / Recentes (S3)",
}: S3FilePickerModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "recent">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [recentFiles, setRecentFiles] = useState<RecentS3Upload[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [customName, setCustomName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const recents = getRecentS3Uploads();
      setRecentFiles(recents);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!customName) {
        setCustomName(file.name);
      }
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);

    try {
      const result = await uploadFileToS3(selectedFile, folderPath);
      const finalName = customName.trim() || selectedFile.name;
      onSelect({
        url: result.url,
        name: finalName,
        key: result.key,
      });
      onOpenChange(false);
      setSelectedFile(null);
      setCustomName("");
    } catch (err: any) {
      alert(err?.message || "Erro ao fazer upload do arquivo para o S3.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectRecent = (file: RecentS3Upload) => {
    onSelect({
      url: file.url,
      name: file.name,
      key: file.key,
    });
    onOpenChange(false);
  };

  const handleRemoveRecent = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentS3Upload(key);
    setRecentFiles(updated);
  };

  const filteredRecents = recentFiles.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.key.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Upload className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex border-b text-xs font-medium mt-2">
          <button
            type="button"
            className={cn(
              "px-4 py-2 border-b-2 -mb-px flex items-center gap-1.5 transition-colors",
              activeTab === "upload"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab("upload")}
          >
            <Upload className="h-3.5 w-3.5" />
            Novo Upload S3
          </button>
          <button
            type="button"
            className={cn(
              "px-4 py-2 border-b-2 -mb-px flex items-center gap-1.5 transition-colors",
              activeTab === "recent"
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setActiveTab("recent")}
          >
            <Clock className="h-3.5 w-3.5" />
            Recentes neste PC
            {recentFiles.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                {recentFiles.length}
              </Badge>
            )}
          </button>
        </div>

        {/* Tab 1: Upload */}
        {activeTab === "upload" && (
          <div className="space-y-4 py-4 min-h-[220px] flex flex-col justify-center">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            {!selectedFile ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="rounded-full bg-muted p-3">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-xs font-medium">
                  Clique aqui ou selecione um arquivo para enviar ao S3
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Suporta imagens (PNG, JPG, WEBP, SVG), PDFs, documentos e anexos.
                </p>
              </div>
            ) : (
              <div className="space-y-3 border rounded-md p-3 bg-muted/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 text-xs">
                    {isImageUrl(selectedFile.name) ? (
                      <ImageIcon className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="font-medium truncate">{selectedFile.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[11px]"
                    onClick={() => {
                      setSelectedFile(null);
                      setCustomName("");
                    }}
                  >
                    Trocar
                  </Button>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Nome / Rótulo da Fonte (opcional)
                  </label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={selectedFile.name}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recentes */}
        {activeTab === "recent" && (
          <div className="space-y-3 py-3 min-h-[220px]">
            {/* Warning banner */}
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2 leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <strong>Aviso de expiração de links:</strong> Uploads feitos neste navegador ficam salvos em seu histórico local. O arquivo em si não expira, mas os links salvos em seu histórico podem expirar com o tempo. Caso um link antigo deixe de carregar, envie o arquivo novamente para obter um novo link válido.
              </div>
            </div>

            {recentFiles.length > 0 && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar nos arquivos recentes..."
                  className="pl-8 h-8 text-xs"
                />
              </div>
            )}

            {filteredRecents.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {searchTerm
                  ? "Nenhum arquivo recente corresponde à busca."
                  : "Nenhum arquivo enviado recentemente neste navegador."}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 divide-y divide-border">
                {filteredRecents.map((file) => {
                  const isImg = isImageUrl(file.name || file.url);
                  let timeAgo = "";
                  try {
                    timeAgo = formatDistanceToNow(new Date(file.uploadedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    });
                  } catch {
                    timeAgo = "";
                  }

                  return (
                    <div
                      key={file.key}
                      onClick={() => handleSelectRecent(file)}
                      className="group flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/60 cursor-pointer transition-colors pt-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 text-xs">
                        {isImg ? (
                          <div className="h-9 w-9 rounded overflow-hidden border bg-background shrink-0 flex items-center justify-center">
                            <img
                              src={file.url}
                              alt={file.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-9 w-9 rounded border bg-muted shrink-0 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <span className="font-medium truncate block text-foreground">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span>{timeAgo || "Upload recente"}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2 font-normal"
                          onClick={() => handleSelectRecent(file)}
                        >
                          Usar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleRemoveRecent(file.key, e)}
                          title="Remover do histórico"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Cancelar
          </Button>

          {activeTab === "upload" && selectedFile && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Enviando S3...
                </>
              ) : (
                <>
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Enviar e Usar
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
