import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { useAuth } from "react-oidc-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@open-urbis/map-ui";
import { Button } from "@open-urbis/map-ui";
import { shareService, SharedMapItem } from "../../../integrations/share-service";

interface ShareHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareHistoryModal = ({ isOpen, onOpenChange }: ShareHistoryModalProps) => {
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
            const result = await shareService.getHistory(userId, page.value, limit);
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
                    <DialogTitle>Histórico de Compartilhamento</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                    {loading.value ? (
                        <div className="flex justify-center p-4">
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        </div>
                    ) : history.value.length === 0 ? (
                        <p className="text-center text-muted-foreground p-4">Nenhum histórico encontrado.</p>
                    ) : (
                        <div className="space-y-2">
                            {history.value.map(item => (
                                <div key={item.id} className="border rounded-md p-3 flex justify-between items-center bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <h4 className="font-medium truncate" title={item.name}>{item.name}</h4>
                                        <p className="text-xs text-muted-foreground truncate" title={item.description || ""}>{item.description || "Sem descrição"}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">
                                            {new Date(item.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleRestore(item)}>
                                        Restaurar
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
