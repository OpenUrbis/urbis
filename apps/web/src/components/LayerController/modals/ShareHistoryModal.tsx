import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { useAuth } from "react-oidc-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui";
import { Calendar, Search, ArrowRight, Loader2, Clock } from "lucide-react";
import { shareService, SharedMapItem } from "../../../integrations/share-service";

interface ShareHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type?: string;
}

export const ShareHistoryModal = ({
  isOpen,
  onOpenChange,
  type = "map",
}: ShareHistoryModalProps) => {
  const typeLabel = type === "map" ? "Visualizações" : "Buscas";
  const history = useSignal<SharedMapItem[]>([]);
    const loading = useSignal(false);
    const page = useSignal(1);
    const total = useSignal(0);
    const limit = 5;
    const auth = useAuth();

    // Use logged in user ID or mock fallback
    const userId = auth.user?.profile.sub || 'mock-user-id-123';

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen, page.value]);

    const loadHistory = async () => {
        loading.value = true;
        try {
            const result = await shareService.getHistory(userId, page.value, limit, type);
            history.value = result.items;
            total.value = result.total;
        } catch (e) {
            console.error("Failed to load history", e);
        } finally {
            loading.value = false;
        }
    };

    const handleRestore = (item: SharedMapItem) => {
        // Full reload to ensure clean state and utilize the query param logic
        window.location.href = `${window.location.origin}/?shareId=${item.id}`;
    };

    const totalPages = Math.ceil(total.value / limit);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Histórico de {typeLabel}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    {loading.value ? (
                        <div className="flex justify-center p-8 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : history.value.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-2">
                            <Search className="h-8 w-8 opacity-50" />
                            <p className="text-sm">Nenhum histórico encontrado.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                            {history.value.map(item => (
                                <div key={item.id} className="group border rounded-lg p-3 flex justify-between items-center bg-card hover:bg-accent/50 transition-all cursor-pointer" onClick={() => handleRestore(item)}>
                                    <div className="flex-1 min-w-0 mr-4 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate line-clamp-1">{item.description || "Sem descrição"}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                            <Clock className="h-3 w-3 ml-1" />
                                            {new Date(item.createdAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-between items-center pt-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={page.value <= 1} 
                                onClick={() => (page.value = Math.max(1, page.value - 1))}
                            >
                                Anterior
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                Página {page.value} de {totalPages}
                            </span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={page.value >= totalPages} 
                                onClick={() => (page.value = Math.min(totalPages, page.value + 1))}
                            >
                                Próxima
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
