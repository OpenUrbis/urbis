import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useSignals } from "@preact/signals-react/runtime";
import { 
  Calculator, 
  Calendar, 
  CreditCard, 
  Settings, 
  Smile, 
  User,
  Search,
  FileText,
  Home,
  BookOpen,
  Edit,
  Layers,
  X
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@open-urbis/map-ui"; // Ensure this path is correct based on exports

import { MOCK_LEI_18080, MOCK_RESOLUCAO_18 } from "../../domain/mocks";

export function CommandMenu() {
  useSignals();
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const openItems: any[] = [];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const navigateTo = (path: string) => {
      setLocation(path);
  };

  // Combine static navigation + specific law search logic
  // For prototype, we mock "Advanced Search" by filtering our mock database inside the command
  const allMocks = [MOCK_LEI_18080, MOCK_RESOLUCAO_18];

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 md:hidden">
          <button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg">
              <Search className="h-6 w-6" />
          </button>
      </div>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou pesquise..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {/* Workspaces / Open Tabs */}
          {openItems.length > 0 && (
              <CommandGroup heading="Abas Abertas">
                  {openItems.map(item => (
                      <CommandItem 
                        key={item.path} 
                        value={`tab-${item.title}`} // unique value for search
                        onSelect={() => runCommand(() => navigateTo(item.path))}
                      >
                          <FileText className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                          {location === item.path && <CommandShortcut>Ativo</CommandShortcut>}
                      </CommandItem>
                  ))}
              </CommandGroup>
          )}
          
          <CommandSeparator />

          {/* Navigation */}
          <CommandGroup heading="Navegação">
            <CommandItem onSelect={() => runCommand(() => navigateTo("/"))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Início</span>
              <CommandShortcut>G H</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigateTo("/search"))}>
              <Search className="mr-2 h-4 w-4" />
              <span>Pesquisa Avançada</span>
              <CommandShortcut>G S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigateTo("/concepts"))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Conceitos</span>
              <CommandShortcut>G C</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />

          {/* Quick Search (Mock DB) */}
          <CommandGroup heading="Legislação (Rápida)">
             {allMocks.map(norma => (
                 <CommandItem 
                    key={norma.id} 
                    value={`${norma.type} ${norma.number} ${norma.ementa}`}
                    onSelect={() => runCommand(() => navigateTo(`/view/${norma.id}`))}
                 >
                     <FileText className="mr-2 h-4 w-4" />
                     <div className="flex flex-col">
                         <span>{norma.type} {norma.number}</span>
                         <span className="text-xs text-muted-foreground truncate max-w-[300px]">{norma.ementa}</span>
                     </div>
                 </CommandItem>
             ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Sistema">
            <CommandItem onSelect={() => runCommand(() => navigateTo("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
              <CommandShortcut>⌘ S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
