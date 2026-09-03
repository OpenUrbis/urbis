import { encode } from "@open-urbis/endereco-digital";
import { Button, UrbisIcon } from "@open-urbis/map-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@open-urbis/map-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@open-urbis/map-ui";
import { DigitalAddressPlate } from "./DigitalAddressPlate";
import { DigitalAddressCard } from "./DigitalAddressCard";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useMapContext } from "../../hooks/useMapContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import proj4 from "proj4";

proj4.defs(
  "EPSG:31983",
  "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
);

const waitForImagesToRender = async (element: HTMLElement) => {
  const images = Array.from(element.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) {
        return;
      }

      await new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      });

      await image.decode().catch(() => undefined);
    }),
  );
};

interface DigitalAddressDetailsProps {
  latitude: number;
  longitude: number;
  plusCode?: string;
  sourceType: "latlon" | "digital" | "pluscode";
  digitalAddress?: string;
  discoveryPoint?: {
    latitude: number;
    longitude: number;
  };
}

export const DigitalAddressDetails = ({
  latitude,
  longitude,
  plusCode,
  sourceType,
  digitalAddress,
  discoveryPoint,
}: DigitalAddressDetailsProps) => {
  const { navigatePop, clearCurrentPage } = useNavigationContext();
  const { digitalAddressFeature } = useMapContext();
  const address = digitalAddress ?? encode(latitude, longitude);
  const [prefix, code] = address.split(" ");
  const plusCodePrefix = plusCode?.replace("+", "").substring(0, 4);
  const shouldShowCoordinates =
    sourceType === "latlon" || Boolean(discoveryPoint);

  const handleDownloadPDF = async () => {
    const element = document.getElementById("digital-address-plate");
    if (!element) return;
    const codeElement = document.getElementById("digital-address-plate-code");

    const originalBorderRadius = element.style.borderRadius;
    const originalBoxShadow = element.style.boxShadow;
    const originalCodeTop = codeElement?.style.top;

    try {
      await document.fonts.ready;
      await waitForImagesToRender(element);

      element.style.borderRadius = "0px";
      element.style.boxShadow = "none";
      if (codeElement) {
        codeElement.style.top = "22.2%";
      }

      const { width: plateWidth, height: plateHeight } =
        element.getBoundingClientRect();

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#003399",
        logging: false,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.86);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [plateWidth, plateHeight],
        hotfixes: ["px_scaling"],
      });

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        plateWidth,
        plateHeight,
        undefined,
        "FAST",
      );
      pdf.save(`endereco-digital-${address.replace(/\s+/g, "-")}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
    } finally {
      element.style.borderRadius = originalBorderRadius;
      element.style.boxShadow = originalBoxShadow;
      if (codeElement) {
        codeElement.style.top = originalCodeTop ?? "";
      }
    }
  };

  return (
    <Card className="rounded-xl border shadow-sm mt-4">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={() => {
              digitalAddressFeature.value = null;
              if (sourceType === "latlon") {
                clearCurrentPage();
                return;
              }
              navigatePop();
            }}
          >
            <UrbisIcon
              name="arrow_back"
              className="text-lg"
              aria-hidden="true"
            />
          </Button>
          <CardTitle className="text-lg font-bold">
            {sourceType === "latlon"
              ? "Coordenada Selecionada"
              : sourceType === "pluscode"
                ? "Plus Code"
                : "Endereço Digital"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        {/* Códigos (Moved to Top) */}
        <div className="space-y-3">
          {/* Digital Address */}
          {sourceType === "digital" && (
            <DigitalAddressCard prefix={prefix} code={code} address={address} />
          )}

          {/* Plus Code */}
          {sourceType === "pluscode" && plusCode && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-center shadow-sm">
              <span className="block text-xs font-bold text-primary mb-1 uppercase tracking-widest">
                Plus Code (Google)
              </span>
              <span className="text-xl font-mono font-bold tracking-wide text-foreground block">
                {plusCode}
              </span>
              <span className="block text-xs text-muted-foreground mt-2">
                Prefixo: {plusCodePrefix}
                {plusCodePrefix === "588M" && " (São Paulo)"}
              </span>
            </div>
          )}

          {sourceType === "digital" && (
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground leading-tight">
                {discoveryPoint ? (
                  <>
                    <span className="font-bold">
                      COMO FUNCIONA A DESCOBERTA:
                    </span>{" "}
                    a partir do local clicado (no mapa com um pino - ), de
                    latitude{" "}
                    {discoveryPoint.latitude.toLocaleString("pt-BR", {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6,
                    })}
                    º e longitude{" "}
                    {discoveryPoint.longitude.toLocaleString("pt-BR", {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6,
                    })}
                    º, é encontrado o espaço do Endereço Digital (retângulo de
                    cerca de 1 metro desenhado no mapa).
                  </>
                ) : (
                  <>
                    <span className="font-bold">INFORMAÇÃO:</span> o retângulo
                    de cerca de 1 metro desenhado no mapa representa o espaço do
                    Endereço Digital informado.
                  </>
                )}
              </p>
            </div>
          )}

          {sourceType === "pluscode" && (
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground leading-tight">
                {discoveryPoint ? (
                  <>
                    <span className="font-bold">
                      COMO FUNCIONA A DESCOBERTA:
                    </span>{" "}
                    a partir do local clicado (no mapa com um pino), de latitude{" "}
                    {discoveryPoint.latitude.toLocaleString("pt-BR", {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6,
                    })}
                    º e longitude{" "}
                    {discoveryPoint.longitude.toLocaleString("pt-BR", {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6,
                    })}
                    º, é encontrado e desenhado o retângulo correspondente ao
                    Plus Code exibido.
                  </>
                ) : (
                  <>
                    <span className="font-bold">INFORMAÇÃO:</span> o retângulo
                    desenhado no mapa representa o espaço do Plus Code
                    informado. Como a busca foi feita diretamente pelo código, o
                    pino e as coordenadas pontuais não são exibidos.
                  </>
                )}
              </p>
            </div>
          )}

          {shouldShowCoordinates && (
            <div className="bg-muted/30 p-3 rounded-md border border-border/50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] uppercase font-medium text-muted-foreground mb-1">
                    Latitude
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {latitude.toLocaleString("pt-BR", {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6,
                    })}
                    °
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-medium text-muted-foreground mb-1">
                    Longitude
                  </span>
                  <span className="font-mono text-sm font-semibold">
                    {longitude.toLocaleString("pt-BR", {
                      minimumFractionDigits: 6,
                      maximumFractionDigits: 6,
                    })}
                    °
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {sourceType === "digital" && (
          <div className="pt-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full rounded-full font-semibold shadow-sm">
                  <UrbisIcon
                    name="directions_car"
                    className="mr-2 text-lg"
                    aria-hidden="true"
                  />
                  Placa do Endereço Digital
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100vw-1rem)] max-w-none gap-3 p-2 sm:max-w-2xl sm:gap-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="pr-8 text-base sm:text-lg">
                    Placa do Endereço Digital
                  </DialogTitle>
                </DialogHeader>
                <div className="flex w-full flex-col items-center justify-center gap-3 p-0 sm:gap-6 sm:p-6">
                  <DigitalAddressPlate
                    address={address}
                    prefix={prefix}
                    code={code}
                  />

                  <Button
                    onClick={handleDownloadPDF}
                    variant="default"
                    className="mt-2 w-full max-w-sm rounded-full text-xs sm:mt-4 sm:text-sm"
                  >
                    <UrbisIcon
                      name="download"
                      className="mr-2"
                      aria-hidden="true"
                    />
                    Baixar arquivo para impressão da placa
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
