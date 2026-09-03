import { useState } from "react";
import { Info } from "lucide-react";
import {
  Button,
  UrbisLicenseSummary,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@open-urbis/map-ui";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { cn } from "@open-urbis/map-ui";

type MapLicenseProps = {
  placement?: "map" | "sidebar";
};

export const MapLicense = ({ placement = "map" }: MapLicenseProps) => {
  const { drawerOpen } = useNavigationContext();
  const [open, setOpen] = useState(false);


  return (
    <>
      <button
        type="button"
        className={cn(
          "urbis-map-license-control pointer-events-auto flex items-center justify-center border border-border bg-background/95 text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-background/90",
          placement === "map"
            ? "absolute bottom-[18px] right-3 h-8 w-8 rounded-md p-0 md:bottom-2 md:left-1/2 md:right-auto md:h-[33px] md:w-[223px] md:-translate-x-1/2 md:justify-between md:rounded-[9px] md:px-3 md:text-[12px] md:font-semibold"
            : "h-[33px] w-[223px] justify-between rounded-[9px] px-3 text-[12px] font-semibold",
          placement === "map" && drawerOpen.value && "md:hidden",
        )}
        onClick={() => setOpen(true)}
        title="Direitos intelectuais e licenciamento do Urbis"
        aria-label="Abrir direitos intelectuais e licenciamento do Urbis"
      >
        <span className="hidden min-w-[58px] text-left text-[14px] font-bold text-muted-foreground md:block">
          Urbis
        </span>
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/70 text-muted-foreground md:h-5 md:w-5"
          aria-hidden="true"
        >
          <Info className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <span className="hidden min-w-[92px] text-right text-[13px] font-bold text-muted-foreground md:block">
          Licenciamento
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[86vh] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Urbis - Licenciamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-foreground">
            <div className="grid gap-3 rounded-xl border bg-muted/30 p-3 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-bold text-muted-foreground">
                  Urbis
                </h3>
                <UrbisLicenseSummary
                  variant="modal"
                  className="mt-2 items-start text-left"
                />
              </div>

              <div>
                <h3 className="text-sm font-bold text-muted-foreground">
                  Mapa.Urbis
                </h3>
                <p className="mt-1 text-xs leading-relaxed">
                  ©{" "}
                  <a
                    href="https://maplibre.org"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    MapLibre
                  </a>
                  ,{" "}
                  <span className="inline-block -scale-x-100" aria-hidden="true">
                    ©
                  </span>{" "}
                  <a
                    href="/license/maplibre.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    licença
                  </a>
                  , ©{" "}
                  <a
                    href="http://openstreetmap.org/copyright"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    OpenStreetMap
                  </a>{" "}
                  <span className="inline-block -scale-x-100" aria-hidden="true">
                    ©
                  </span>{" "}
                  <a
                    href="/license/odbl-v1.0.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline font-semibold"
                  >
                    ODbL v1.0
                  </a>{" "}
                  e demais fornecedores dos mapas-base quando exibidos.
                </p>
              </div>
            </div>

            <section className="space-y-1">
              <h3 className="text-sm font-bold text-muted-foreground">
                Legenda
              </h3>
              <p className="text-xs leading-relaxed">
                <strong>©</strong> indica propriedade intelectual. <strong><span className="inline-block -scale-x-100" aria-hidden="true">©</span></strong> indica licença pública de uso livre com cláusula copyleft, que obriga que a distribuição ou obra derivada também tenham o mesmo tipo de licença.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground">
                ATENÇÃO
              </h3>
              <p className="text-xs leading-relaxed">
                Algumas atribuições e licenças são exibidas no canto inferior direito do Mapa automaticamente pelas tecnologias utilizadas. Aqui você encontra explicações completas e sistemáticas sobre a propriedade intelectual e licenciamento de todas as tecnologias e dados utilizados no Mapa.Urbis.
              </p>
              <p className="text-xs leading-relaxed">
                Os dados das camadas do Urbis são públicos em observância às
                normas constitucionais do princípio da transparência e do
                direito à informação. Independentemente da origem, todos os
                dados recebem tratamentos próprios no Urbis, exceto mapas-base,
                e são disponibilizados neste formato pela licença CC BY-SA 4.0,
                em regra, que permite inclusive o uso para fins lucrativos (observar, contudo, as
                vedações ao uso comercial de dados ambientais fornecidos por
                órgãos públicos pelo art. 2º - § 1º da Lei federal nº
                10.650/2003). Excepcionalmente, outras licenças podem se aplicar aos
                dados de uma camada quando indicado nos metadados, que devem ser
                consultados antes de qualquer uso não pessoal.
              </p>
              <p className="text-xs leading-relaxed">
                Dados visualizados por GeoServers informados ou escolhidos pelo
                usuário se sujeitam às licenças próprias desses serviços.
              </p>
            </section>
          </div>

          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
