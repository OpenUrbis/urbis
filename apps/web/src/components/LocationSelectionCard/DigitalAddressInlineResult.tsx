import { Button, UrbisIcon } from "@open-urbis/map-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@open-urbis/map-ui";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { DigitalAddressCard } from "./DigitalAddressCard";
import { DigitalAddressPlate } from "./DigitalAddressPlate";

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

export interface DigitalAddressInlineResultData {
  latitude: number;
  longitude: number;
  plusCode: string;
  digitalAddress: string;
  discoveryPoint?: {
    latitude: number;
    longitude: number;
  };
}

interface DigitalAddressInlineResultProps {
  result: DigitalAddressInlineResultData;
  showPlateButton?: boolean;
}

export const DigitalAddressPlateDialog = ({
  result,
}: {
  result: DigitalAddressInlineResultData;
}) => {
  const [prefix, code] = result.digitalAddress.split(" ");

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
      pdf.save(
        `endereco-digital-${result.digitalAddress.replace(/\s+/g, "-")}.pdf`,
      );
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
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-8 rounded-full px-4 text-xs font-semibold shadow-sm"
          size="sm"
        >
          Gerar placa
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
            address={result.digitalAddress}
            prefix={prefix}
            code={code}
          />

          <Button
            onClick={handleDownloadPDF}
            variant="default"
            className="mt-2 w-full max-w-sm rounded-full text-xs sm:mt-4 sm:text-sm"
          >
            <UrbisIcon name="download" className="mr-2" aria-hidden="true" />
            Baixar arquivo para impressão da placa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const DigitalAddressInlineResult = ({
  result,
  showPlateButton = true,
}: DigitalAddressInlineResultProps) => {
  const [prefix, code] = result.digitalAddress.split(" ");

  return (
    <div className="space-y-2 rounded-lg bg-transparent p-0">
      <DigitalAddressCard
        prefix={prefix}
        code={code}
        address={result.digitalAddress}
      />

      <div className="space-y-1.5 pt-1">
        <p className="text-xs leading-snug text-muted-foreground">
          {result.discoveryPoint ? (
            <>
              <span className="font-bold text-foreground">
                COMO FUNCIONA A DESCOBERTA:
              </span>{" "}
              a partir do local clicado no mapa, de latitude{" "}
              {result.discoveryPoint.latitude.toLocaleString("pt-BR", {
                minimumFractionDigits: 6,
                maximumFractionDigits: 6,
              })}
              º e longitude{" "}
              {result.discoveryPoint.longitude.toLocaleString("pt-BR", {
                minimumFractionDigits: 6,
                maximumFractionDigits: 6,
              })}
              º, é encontrado o espaço do Endereço Digital, representado pelo
              retângulo desenhado no mapa.
            </>
          ) : (
            <>
              <span className="font-bold text-foreground">INFORMAÇÃO:</span> o
              retângulo de cerca de 1 metro desenhado no mapa representa o
              espaço do Endereço Digital informado.
            </>
          )}
        </p>
      </div>

      {showPlateButton && <DigitalAddressPlateDialog result={result} />}
    </div>
  );
};
