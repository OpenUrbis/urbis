// src/pages/Home.tsx
import { useState } from "react";
import { Mosaico } from "../components/home/Mosaico";
import { Sidebar } from "@open-urbis/map-ui"; 
import { HelpSidebarContent } from "@open-urbis/map-ui"; // 👈 AQUI!
import { HelpCircle } from "lucide-react";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-muted/30 min-h-screen relative">
      {/* Conteúdo principal */}
      <Mosaico />

      {/* Botão flutuante — abre o Sidebar de Ajuda */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed bottom-6 left-6 h-14 w-14 bg-primary text-primary-foreground
                   rounded-full flex items-center justify-center shadow-xl 
                   hover:bg-primary/90 hover:scale-105 transition-all duration-200 
                   z-50 ring-offset-2 ring-2 ring-transparent hover:ring-primary/50"
        aria-label="Abrir central de ajuda"
      >
        <HelpCircle className="h-7 w-7" />
      </button>

      {/* Sidebar lateral GLOBAL */}
      <Sidebar 
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Ajuda"
        side="right"
      >
        {/* Conteúdo com seções colapsáveis */}
        <HelpSidebarContent />
      </Sidebar>
    </div>
  );
}
