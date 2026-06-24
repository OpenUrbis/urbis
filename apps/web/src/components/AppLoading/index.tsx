import { useAppLoading } from "../../hooks/useAppLoading";

export const AppLoading = () => {
  const { loadingState, appError } = useAppLoading();
  const state = loadingState.value;
  const error = appError.value;

  if (error && error.isFatal) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-all duration-300">
        <div className="flex flex-col items-center gap-4 p-8 animate-in fade-in zoom-in-95 duration-300 max-w-md text-center">
          <div className="relative h-16 w-16 flex items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
            <span className="material-symbols-outlined text-4xl">
              error
            </span>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Ops! Algo deu errado
          </h2>
          <p className="text-sm text-muted-foreground">
            {error.message}
          </p>
          <div className="mt-2 px-3 py-1 bg-muted rounded text-xs font-mono text-muted-foreground">
            Código: {error.code}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!state.isLoading) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
      <div className="flex flex-col items-center gap-4 p-8 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative h-12 w-12 flex items-center justify-center">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">
            progress_activity
          </span>
        </div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          {state.text}
        </p>
      </div>
    </div>
  );
};
