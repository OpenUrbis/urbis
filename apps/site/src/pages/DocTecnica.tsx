import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Github } from "lucide-react";
import { Button } from "@open-urbis/map-ui/ui/button";

export default function DocTecnica() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col font-sans bg-muted/30 h-full min-h-[calc(100vh-64px)]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 py-6 px-4 max-w-[900px] mx-auto w-full border-b border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 shrink-0 self-start md:self-center"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold m-0 text-foreground">
          Documentação Técnica
        </h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center py-20 px-4 text-center space-y-8">
        <p className="text-xl text-muted-foreground max-w-2xl">
          O projeto Urbis possui documentação técnica completa e é Open Source.
          Conheça mais em:
        </p>
        <div className="flex flex-wrap justify-center gap-6">
          <a
            href="https://docs.urbis.prefeitura.sp.gov.br"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="h-14 px-8 text-lg gap-2">
              <BookOpen className="h-5 w-5" /> Docs.Urbis
            </Button>
          </a>
          <a
            href="https://github.com/OpenUrbis"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="secondary"
              className="h-14 px-8 text-lg gap-2"
            >
              <Github className="h-5 w-5" /> Github
            </Button>
          </a>
        </div>
      </main>
    </div>
  );
}
