import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { Info, HelpCircle, BookOpen, Layers, Scale } from "lucide-react";

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  category?: "general" | "normative" | "situations" | "authorities";
}

export function InfoModal({
  open,
  onOpenChange,
  title = "Informações do Legis",
  category = "general",
}: InfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Guia de utilização e especificações do sistema Legis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm text-foreground">
          {category === "general" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Módulo Legis</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    O Legis é o módulo responsável pela gestão, consolidação e
                    estruturação do acervo normativo municipal e coletâneas temáticas.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Scale className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Originais Normativos</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Cadastre leis, decretos, portarias e resoluções com estruturação
                    automática em artigos, parágrafos, incisos, alíneas e itens.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Layers className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Situações Especiais e Consolições</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Vincule alterações normativas (revogações, vetos, novas redações,
                    alterações de vigência) a dispositivos específicos do texto.
                  </p>
                </div>
              </div>
            </div>
          )}

          {category === "normative" && (
            <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                <strong>Estrutura Hierárquica:</strong> Os elementos normativos
                devem respeitar a hierarquia legal (Parte, Livro, Título, Capítulo, Seção,
                Artigo, Parágrafo, Inciso, Alínea, Item).
              </p>
              <p>
                <strong>Auto-Estruturação:</strong> O editor reconhece automaticamente
                as chaves estruturais (como &ldquo;Art. 1º&rdquo;, &ldquo;§ 1º&rdquo;, &ldquo;Inciso I&rdquo;) mesmo
                quando contiverem formatação ou hiperlinks.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InfoButton({
  onClick,
  title = "Informações",
  className = "",
}: {
  onClick: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-7 w-7 text-muted-foreground hover:text-foreground ${className}`}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
}
