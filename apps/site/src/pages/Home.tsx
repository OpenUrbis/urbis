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
