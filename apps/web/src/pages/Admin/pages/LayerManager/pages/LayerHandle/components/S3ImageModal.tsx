import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link as LinkIcon, Loader2, Image as ImageIcon } from "lucide-react";

interface S3ImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertImage: (imageUrl: string, altText?: string) => void;
}

export const S3ImageModal = ({
  open,
  onOpenChange,
  onInsertImage,
}: S3ImageModalProps) => {
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [altText, setAltText] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Selecione um arquivo de imagem válido (PNG, JPG, WebP, SVG, etc.).");
        return;
      }
      setError("");
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadAndInsert = async () => {
    setError("");

    if (activeTab === "url") {
      if (!imageUrl.trim()) {
        setError("Insira uma URL de imagem válida.");
        return;
      }
      onInsertImage(imageUrl.trim(), altText.trim());
      handleClose();
      return;
    }

    if (!selectedFile) {
      setError("Selecione um arquivo de imagem para fazer upload.");
      return;
    }

    setUploading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || "/api";
      
      // Request S3 presigned upload URL
      const res = await fetch(`${apiBaseUrl}/files/public/upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: selectedFile.type || "image/jpeg",
          folderPath: "layer-descriptions",
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao obter URL de upload do S3.");
      }

      const { uploadURL } = await res.json();

      // Upload file directly to S3
      const putRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": selectedFile.type || "image/jpeg" },
        body: selectedFile,
      });

      if (!putRes.ok) {
        throw new Error("Erro ao enviar imagem para o S3.");
      }

      // S3 direct public URL
      const finalUrl = uploadURL.split("?")[0];
      onInsertImage(finalUrl, altText.trim());
      handleClose();
    } catch (err: any) {
      setError(err?.message || "Falha ao realizar upload da imagem para o S3.");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setImageUrl("");
    setAltText("");
    setError("");
    setUploading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Inserir Imagem (S3)
          </DialogTitle>
          <DialogDescription>
            Faça upload de uma imagem para o S3 ou insira o link de uma imagem externa.
          </DialogDescription>
        </DialogHeader>

        <div className="flex border-b text-sm font-medium">
          <button
            type="button"
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-2 transition-colors ${
              activeTab === "upload"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("upload")}
          >
            <Upload className="h-4 w-4" />
            Upload S3
          </button>
          <button
            type="button"
            className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-2 transition-colors ${
              activeTab === "url"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("url")}
          >
            <LinkIcon className="h-4 w-4" />
            URL da Imagem
          </button>
        </div>

        <div className="space-y-4 py-2">
          {activeTab === "upload" ? (
            <div className="space-y-3">
              <Label htmlFor="s3-file-input">Selecione uma imagem</Label>
              <Input
                id="s3-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />

              {previewUrl && (
                <div className="relative mt-2 flex max-h-48 items-center justify-center overflow-hidden rounded-md border bg-muted/20 p-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-44 object-contain rounded"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Label htmlFor="image-url-input">URL da Imagem</Label>
              <Input
                id="image-url-input"
                type="url"
                placeholder="https://exemplo.com/imagem.png"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="image-alt-input">Texto alternativo (Alt)</Label>
            <Input
              id="image-alt-input"
              type="text"
              placeholder="Ex: Legenda ou descrição da imagem"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={uploading}
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-medium">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleUploadAndInsert}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando S3...
              </>
            ) : (
              "Inserir Imagem"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
