import React from 'react';
import { Link } from 'wouter';
import { FileText, PlusCircle, Search, BookOpen, Settings } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@open-urbis/map-ui';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12 md:py-20">
        <div className="bg-primary/10 text-primary w-fit mx-auto px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            Legis.Urbis v0.1 (Protótipo)
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
          Gestão de Normas <br className="hidden md:block" />
          <span className="text-primary">Inteligente e Conectada</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Ferramenta avançada para estruturação, análise e publicação de normas técnicas e legais.
        </p>
        
        <div className="flex justify-center gap-4 mt-8">
            <Button size="default" asChild className="rounded-full px-6">
                <Link href="/search">
                    <Search className="mr-2 h-4 w-4" />
                    Pesquisar Normas
                </Link>
            </Button>
            <Button size="default" variant="outline" asChild className="rounded-full px-6">
                <Link href="/concepts">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Conceitos
                </Link>
            </Button>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Editor Entry Point */}
        <Link href="/editor/new" className="block group h-full">
            <Card className="h-full hover:border-primary transition-colors cursor-pointer border-dashed bg-muted/20">
                <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                        <PlusCircle className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Nova Norma</CardTitle>
                        <CardDescription className="text-xs">Editor Inteligente</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>

        <Link href="/view/18080" className="block group h-full">
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Lei 18.080/2024</CardTitle>
                        <CardDescription className="text-xs">Veto e Vigência</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>

        <Link href="/view/32154" className="block group h-full">
            <Card className="h-full hover:border-primary transition-colors cursor-pointer">
                <CardHeader className="p-4 flex flex-row items-center gap-4 space-y-0">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <FileText className="h-4 w-4" />
                    </div>
                    <div>
                        <CardTitle className="text-base">Resolução 18/1871</CardTitle>
                        <CardDescription className="text-xs">Norma Histórica</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>
      </section>


    </div>
  );
}
