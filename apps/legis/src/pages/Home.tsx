import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@open-urbis/map-ui";
import { Book, Info, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao Legis.Urbis</h1>
        <p className="text-muted-foreground text-lg">
          Ferramenta de explicação de conceitos do Sistema Automático de Análise de Dados Espaciais (SAADE).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              O que é o Legis?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              O Legis.Urbis é focado na finalidade de auxiliar a compreensão das informações normativas, dando efetividade ao sistema.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              SAADE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Parte integrante do SAADE, focado na explicação clara e acessível de conceitos complexos de análise de dados espaciais.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Efetividade Normativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Garantimos que as normas sejam compreendidas por todos os usuários, facilitando a aplicação correta dos dados espaciais.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Começando</h2>
        <p className="text-muted-foreground mb-6">
          Utilize o menu lateral para navegar entre os diferentes conceitos e ferramentas disponíveis. Legis.Urbis foi projetado para ser seu guia definitivo na compreensão normativa dentro do SAADE.
        </p>
      </div>
    </div>
  );
}
