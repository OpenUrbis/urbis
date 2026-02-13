import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@open-urbis/map-ui';
import { Link } from 'wouter';
import { FileText } from 'lucide-react';
export default function Home() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-8 p-8">
      <section className="text-center space-y-4 max-w-2xl">
        <div className="bg-primary/10 text-primary w-fit mx-auto px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            Legis.Urbis
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
          Bem-vindo ao Legis
        </h1>
        <p className="text-xl text-muted-foreground">
          Sistema de gestão de conhecimento e normas.
        </p>
        
        <div className="flex justify-center gap-4 pt-4">
            <Link href="/pages">
                <Button size="lg" className="gap-2">
                    <FileText className="h-5 w-5" />
                    Gerenciar Páginas
                </Button>
            </Link>
        </div>
      </section>
      </div>
    </div>
  );
}
