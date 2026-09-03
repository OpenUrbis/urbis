import { useEffect, useState } from "react";
import { useAuth } from "@open-urbis/map-auth";
import { shareService, SharedMapItem } from "../../integrations/share-service";
import { Button, UrbisIcon } from "@open-urbis/map-ui";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import {
  ArrowLeft,
  Bookmark,
  SlidersHorizontal,
  Globe,
  Loader2,
  MapPin,
  Share2,
  User,
} from "lucide-react";
import { AuthRequiredModal } from "../../components/AuthRequiredModal";
import { ShareHistoryModal } from "../../components/LayerController/modals/ShareHistoryModal";
import { useSignal } from "@preact/signals";

const itemDate = (item: SharedMapItem) =>
  item.createdAt ? new Date(item.createdAt).toLocaleDateString("pt-BR") : "";

const LibraryItemList = ({
  items,
  empty,
  onSelect,
}: {
  items: SharedMapItem[];
  empty: string;
  onSelect: (item: SharedMapItem) => void;
}) => {
  if (items.length === 0) {
    return <p className="px-1 text-xs italic text-white/70">{empty}</p>;
  }

  return (
    <div className="space-y-1.5">
      {items.slice(0, 6).map((item) => (
        <button
          key={item.id}
          type="button"
          className="group flex w-full items-start justify-between gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-left text-white transition hover:bg-white/15"
          onClick={() => onSelect(item)}
        >
          <span className="min-w-0">
            <span className="line-clamp-2 text-sm font-bold leading-snug">
              {item.name}
            </span>
            {item.description && (
              <span className="mt-0.5 line-clamp-1 block text-xs font-medium text-white/70">
                {item.description}
              </span>
            )}
            <span className="mt-1 block text-[10px] text-white/55">
              {itemDate(item)}
            </span>
          </span>
          <UrbisIcon
            name="arrow_forward"
            className="mt-0.5 shrink-0 text-lg text-white/70 group-hover:text-white"
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
};

export const MapLibrary = () => {
  const auth = useAuth();
  const { navigatePop } = useNavigationContext();

  const [publicMaps, setPublicMaps] = useState<SharedMapItem[]>([]);
  const [publicSearches, setPublicSearches] = useState<SharedMapItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isAuthModalOpen = useSignal(false);
  const isHistoryOpen = useSignal(false);
  const historyType = useSignal<"map" | "search">("map");

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const [maps, searches] = await Promise.all([
          shareService.findAllPublic(1, 50, "map"),
          shareService.findAllPublic(1, 50, "search"),
        ]);

        setPublicMaps(maps.items);
        setPublicSearches(searches.items);
      } catch (error) {
        console.error("Failed to fetch profiles", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const openUserItems = (type: "map" | "search") => {
    if (!auth.isAuthenticated) {
      isAuthModalOpen.value = true;
      return;
    }
    historyType.value = type;
    isHistoryOpen.value = true;
  };

  const handleSelectProfile = (profile: SharedMapItem) => {
    window.location.href = `${window.location.origin}/?shareId=${profile.id}`;
  };

  const PrivateShortcut = ({
    icon,
    title,
    description,
    onClick,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
  }) => (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-white transition hover:bg-white/10"
      onClick={onClick}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{title}</span>
        <span className="block text-[11px] leading-snug text-white/65">
          {description}
        </span>
      </span>
    </button>
  );

  const LibrarySection = ({
    icon,
    title,
    mineLabel,
    sharedLabel,
    publicLabel,
    publicItems,
    publicEmpty,
    ownType,
  }: {
    icon: React.ReactNode;
    title: string;
    mineLabel: string;
    sharedLabel: string;
    publicLabel: string;
    publicItems: SharedMapItem[];
    publicEmpty: string;
    ownType: "map" | "search";
  }) => (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-white">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
          {icon}
        </span>
        <h3 className="text-base font-bold">{title}</h3>
      </div>

      <div className="grid gap-2">
        <PrivateShortcut
          icon={<User className="h-4 w-4" />}
          title={mineLabel}
          description="Somente usuários logados"
          onClick={() => openUserItems(ownType)}
        />
        <PrivateShortcut
          icon={<Share2 className="h-4 w-4" />}
          title={sharedLabel}
          description={
            auth.isAuthenticated
              ? "Itens compartilhados diretamente aparecerão aqui"
              : "Somente usuários logados"
          }
          onClick={() => {
            if (!auth.isAuthenticated) isAuthModalOpen.value = true;
          }}
        />
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/10 p-2.5">
        <div className="mb-2 flex items-center gap-2 px-1 text-sm font-bold text-white">
          <Globe className="h-4 w-4" />
          {publicLabel}
        </div>
        {loading ? (
          <div className="flex justify-center py-3 text-white/60">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <LibraryItemList
            items={publicItems}
            empty={publicEmpty}
            onSelect={handleSelectProfile}
          />
        )}
      </div>
    </section>
  );

  return (
    <>
      <div className="rounded-[27px] bg-[#545454] p-4 text-white shadow-xl">
        <div className="mb-4 flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={navigatePop}
            className="h-8 w-8 shrink-0 rounded-full text-white hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-xl font-bold leading-tight">
              Biblioteca de localizações
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              Acesse prospecções, localizações e conteúdos salvos para aplicar
              no mapa.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <LibrarySection
            icon={<SlidersHorizontal className="h-4 w-4" />}
            title="Pesquisa prospectiva"
            mineLabel="Minhas prospecções"
            sharedLabel="Prospecções compartilhadas com você"
            publicLabel="Prospecções públicas"
            publicItems={publicSearches}
            publicEmpty="Nenhuma prospecção pública disponível."
            ownType="search"
          />

          <div className="h-px bg-white/30" />

          <LibrarySection
            icon={<MapPin className="h-4 w-4" />}
            title="Localizações"
            mineLabel="Minhas localizações"
            sharedLabel="Localizações compartilhadas com você"
            publicLabel="Localizações públicas"
            publicItems={publicMaps}
            publicEmpty="Nenhuma localização pública disponível."
            ownType="map"
          />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs text-white/70">
          <Bookmark className="h-4 w-4 shrink-0" />
          Salve e compartilhe localizações pelo menu de compartilhamento do
          mapa.
        </div>
      </div>

      <AuthRequiredModal
        isOpen={isAuthModalOpen.value}
        onOpenChange={(v) => (isAuthModalOpen.value = v)}
        title="Acesso às suas localizações"
        description="Você precisa estar autenticado para acessar prospecções e localizações salvas ou compartilhadas com você."
      />

      <ShareHistoryModal
        isOpen={isHistoryOpen.value}
        onOpenChange={(v) => (isHistoryOpen.value = v)}
        type={historyType.value}
      />
    </>
  );
};
