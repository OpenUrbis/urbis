import React from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { Info, HelpCircle, BookOpen, Layers, Scale, Code } from "lucide-react";

interface InfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  category?: "general" | "normative" | "situations" | "authorities" | "html_tags";
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
                  <h4 className="font-semibold">Situações Especiais e Consolidações</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Vincule alterações normativas (revogações, vetos, novas redações,
                    alterações de vigência) a dispositivos específicos do texto.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Code className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Tags HTML Reconhecidas e Suportadas</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    O motor de auto-estruturação preserva formatações ricas no conteúdo dos dispositivos:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                    <li><strong>Formatação de texto:</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;b&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;strong&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;i&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;em&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;u&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;span&gt;</code>.</li>
                    <li><strong>Hiperlinks e âncoras:</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;a&gt;</code>.</li>
                    <li><strong>Texto riscado / revogações:</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;s&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;strike&gt;</code>.</li>
                    <li><strong>Tabelas normativas:</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;table&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;thead&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;tbody&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;tr&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;th&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;td&gt;</code>.</li>
                    <li><strong>Blocos e quebras:</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;br&gt;</code>, <code className="bg-muted px-1 py-0.5 rounded font-mono text-[11px]">&lt;p&gt;</code>.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {(category === "normative" || category === "html_tags") && (
            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div className="rounded-lg border p-3 bg-muted/30">
                <h4 className="font-semibold text-foreground text-sm mb-1">Tags HTML Reconhecidas</h4>
                <p className="mb-2">
                  As seguintes tags HTML são suportadas pelo editor e preservadas durante a auto-estruturação e sincronização:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 border rounded bg-background">
                    <p className="font-medium text-foreground">&lt;b&gt;, &lt;strong&gt;</p>
                    <p className="text-muted-foreground">Texto em negrito.</p>
                  </div>
                  <div className="p-2 border rounded bg-background">
                    <p className="font-medium text-foreground">&lt;i&gt;, &lt;em&gt;</p>
                    <p className="text-muted-foreground">Texto em itálico.</p>
                  </div>
                  <div className="p-2 border rounded bg-background">
                    <p className="font-medium text-foreground">&lt;u&gt;</p>
                    <p className="text-muted-foreground">Texto sublinhado.</p>
                  </div>
                  <div className="p-2 border rounded bg-background">
                    <p className="font-medium text-foreground">&lt;s&gt;, &lt;strike&gt;</p>
                    <p className="text-muted-foreground">Texto riscado (utilizado para dispositivos revogados ou vetados no original).</p>
                  </div>
                  <div className="p-2 border rounded bg-background">
                    <p className="font-medium text-foreground">&lt;a&gt;</p>
                    <p className="text-muted-foreground">Hiperlinks e referências externas.</p>
                  </div>
                  <div className="p-2 border rounded bg-background">
                    <p className="font-medium text-foreground">&lt;span&gt;</p>
                    <p className="text-muted-foreground">Estilos inline e anotações visuais.</p>
                  </div>
                  <div className="p-2 border rounded bg-background md:col-span-2">
                    <p className="font-medium text-foreground">&lt;table&gt;, &lt;tr&gt;, &lt;td&gt;, &lt;th&gt;</p>
                    <p className="text-muted-foreground">Tabelas e anexos tabulares normativos.</p>
                  </div>
                </div>
              </div>

              {category === "normative" && (
                <div className="space-y-1 pt-1">
                  <p>
                    <strong>Estrutura Hierárquica:</strong> Os elementos normativos
                    devem respeitar a hierarquia legal (Parte, Livro, Título, Capítulo, Seção,
                    Artigo, Parágrafo, Inciso, Alínea, Item).
                  </p>
                  <p>
                    <strong>Auto-Estruturação:</strong> O editor reconhece automaticamente
                    as chaves estruturais (como &ldquo;Art. 1º&rdquo;, &ldquo;§ 1º&rdquo;, &ldquo;Inciso I&rdquo;) mesmo
                    quando contiverem tags HTML suportadas ou formatações no prefixo.
                  </p>
                </div>
              )}
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
