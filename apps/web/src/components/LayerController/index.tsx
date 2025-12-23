import { signal } from "@preact/signals";
import "preact/compat";
import { useState } from "preact/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMapContext } from "../../hooks/useMapContext";
import { LayerGroup } from "./LayerGroup";
import { LayerSortableList } from "./LayerSortableList";
import { AddLayerModal } from "./modals/AddLayerModal";
import { ShareModal } from "./modals/ShareModal";
import { useLayerPersistence } from "../../hooks/useLayerPersistence";

const isCollapsed = signal<boolean>(false);

export const LayerController = () => {
  useLayerPersistence();
  const { layerGroups } = useMapContext();
  const [activeTab, setActiveTab] = useState<'sources' | 'visible'>('sources');
  const [searchValue, setSearchValue] = useState('');
  const [isAddLayerOpen, setIsAddLayerOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-9 right-2 z-[8] flex gap-2 items-center">
        {!isCollapsed.value && (
          <Button
            onClick={() => (isCollapsed.value = true)}
            variant="outline"
            className="shadow-md rounded-full h-12 px-5 text-base bg-background/80 backdrop-blur-md hover:bg-accent hover:text-accent-foreground"
          >
            <span className="material-symbols-outlined mr-1 text-xl">
              layers
            </span>
            Gerenciar
          </Button>
        )}
      </div>

      {isCollapsed.value && (
        <div className="fixed top-[74px] right-[46px] z-[10] w-[340px] bg-background/80 backdrop-blur-md rounded-xl shadow-lg overflow-hidden max-h-[calc(100vh-100px)] border flex flex-col transition-all">
          <div className="flex items-center justify-between p-3 border-b bg-background/50">
            <h5 className="text-sm font-semibold m-0">Gerenciar Camadas</h5>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => (isCollapsed.value = false)}
              aria-label="Fechar"
            >
               <span className="material-symbols-outlined text-base">close</span>
            </Button>
          </div>
          
          <div className="flex items-center border-b bg-background/30 px-2 pt-1">
             <button 
                className={cn(
                  "flex-1 pb-2 pt-2 text-xs font-medium transition-all border-b-2 focus-visible:outline-none",
                  activeTab === 'sources' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
                onClick={() => setActiveTab('sources')}
             >
                Fontes de Dados
             </button>
             <button 
                className={cn(
                  "flex-1 pb-2 pt-2 text-xs font-medium transition-all border-b-2 focus-visible:outline-none",
                  activeTab === 'visible' ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                )}
                onClick={() => setActiveTab('visible')}
             >
                Camadas Selecionadas
             </button>
          </div>
          
          {activeTab === 'sources' && (
             <div className="p-2 border-b bg-background/30">
                <div className="relative">
                  <span className="absolute left-2 top-1.5 material-symbols-outlined text-base text-muted-foreground">search</span>
                  <Input 
                    placeholder="Buscar camadas..." 
                    className="h-8 pl-8 text-sm bg-background/50" 
                    value={searchValue}
                    onInput={(e) => setSearchValue((e.target as HTMLInputElement).value)}
                  />
                </div>
             </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {activeTab === 'sources' ? (
               <div className="flex flex-col">
                 {layerGroups.value.map((group, i) => (
                   <LayerGroup 
                      key={`group-main-${i}`} 
                      group={group} 
                      searchValue={searchValue}
                   />
                 ))}
               </div>
            ) : (
               <LayerSortableList />
            )}
          </div>

          <div className="p-3 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 grid grid-cols-2 gap-2 shrink-0">
              <Button
                variant="outline"
                className="w-full justify-start text-xs h-9 px-3"
                onClick={() => setIsAddLayerOpen(true)}
              >
                 <span className="material-symbols-outlined text-base mr-2">add_circle</span>
                 Adicionar Camada
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs h-9 px-3"
                onClick={() => setIsShareOpen(true)}
              >
                 <span className="material-symbols-outlined text-base mr-2">share</span>
                 Compartilhar
              </Button>
          </div>
        </div>
      )}

      <AddLayerModal isOpen={isAddLayerOpen} onOpenChange={setIsAddLayerOpen} />
      <ShareModal isOpen={isShareOpen} onOpenChange={setIsShareOpen} />
    </>
  );
};
