import React, { useEffect, useState } from "react";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from "cmdk";
import { useLocation } from "wouter";
import { FileText, Plus, Search, Settings, User, Laptop } from "lucide-react";
import { usePage } from "@/hooks/use-page";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { createPage } = usePage();

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

  const run = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} label="Global Command Menu">
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-0 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
        <CommandInput 
            placeholder="Digite um comando ou busque..." 
            className="flex h-11 w-full rounded-md bg-transparent py-3 px-4 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-b"
        />
        <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
          <CommandEmpty className="py-6 text-center text-sm">Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Sugestões">
            <CommandItem className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => run(() => setLocation('/pages/new'))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Nova Página</span>
              <span className="ml-auto text-xs tracking-widest text-muted-foreground">⌘N</span>
            </CommandItem>
            <CommandItem className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => run(() => setLocation('/pages'))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Ir para Páginas</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator className="-mx-1 h-px bg-border" />
          <CommandGroup heading="Configurações">
            <CommandItem className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" onSelect={() => run(() => console.log('Settings'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </div>
    </CommandDialog>
  );
}
