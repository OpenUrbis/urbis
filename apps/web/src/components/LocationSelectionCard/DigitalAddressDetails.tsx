import { encode } from '@open-urbis/endereco-digital';
import { Button } from "@open-urbis/map-ui";
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
// @ts-ignore
import html2canvas from "html2canvas";
// @ts-ignore
import jsPDF from "jspdf";
import proj4 from "proj4";

proj4.defs("EPSG:31983", "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

interface DigitalAddressDetailsProps {
  latitude: number;
  longitude: number;
  plusCode?: string;
  sourceType: "latlon" | "digital" | "pluscode";
}

export const DigitalAddressDetails = ({ latitude, longitude, plusCode, sourceType }: DigitalAddressDetailsProps) => {
  const { clearCurrentPage } = useNavigationContext();
  const { digitalAddressFeature } = useMapContext();
  const address = encode(latitude, longitude);
  const [prefix, code] = address.split(' ');

  const handleDownloadPDF = async () => {
    const element = document.getElementById('digital-address-plate');
    if (!element) return;

    try {
      // Temporarily remove rounded corners for capture
      const originalBorderRadius = element.style.borderRadius;
      element.style.borderRadius = '0px';

      const canvas = await html2canvas(element, {
        scale: 4,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      // Restore original border radius
      element.style.borderRadius = originalBorderRadius;
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Use full page dimensions to eliminate white borders
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`endereco-digital-${address.replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF", err);
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
              clearCurrentPage();
            }}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Button>
          <CardTitle className="text-lg font-bold">Endereço Digital</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-6">

        {/* Códigos (Moved to Top) */}
        <div className="space-y-3">
          {/* Digital Address */}
          {(sourceType === 'latlon' || sourceType === 'digital') && (
            <DigitalAddressCard prefix={prefix} code={code} address={address} />
          )}

          {/* Plus Code */}
          {sourceType === 'pluscode' && plusCode && (
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-center shadow-sm">
              <span className="block text-xs font-bold text-primary mb-1 uppercase tracking-widest">Plus Code (Google)</span>
              <span className="text-xl font-mono font-bold tracking-wide text-foreground block">
                {plusCode}
              </span>
            </div>
          )}
        </div>

        {/* Espaço Representado */}
        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Abrangência do Endereço (1m²)
            </h3>
            <p className="text-[11px] text-muted-foreground leading-tight">
              O polígono destacado no mapa representa o metro quadrado exato identificado por este Endereço Digital.
            </p>
          </div>

          <div className="bg-muted/30 p-3 rounded-md border border-border/50">
            <span className="block text-[10px] uppercase font-bold text-primary/70 mb-2 tracking-tighter">
              Coordenada Selecionada (SIRGAS 2000 / Graus decimais)
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] uppercase font-medium text-muted-foreground mb-1">Latitude</span>
                <span className="font-mono text-sm font-semibold">{latitude.toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}°</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-medium text-muted-foreground mb-1">Longitude</span>
                <span className="font-mono text-sm font-semibold">{longitude.toLocaleString('pt-BR', { minimumFractionDigits: 6, maximumFractionDigits: 6 })}°</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full rounded-full font-semibold shadow-sm">
                <span className="material-symbols-outlined mr-2 text-lg">directions_car</span>
                Gerar Placa Virtual
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Placa Virtual</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center p-6 gap-6 w-full">
                <DigitalAddressPlate
                  address={address}
                  prefix={prefix}
                  code={code}
                />

                <Button onClick={handleDownloadPDF} variant="default" className="w-full max-w-sm rounded-full mt-4">
                  <span className="material-symbols-outlined mr-2">download</span>
                  Baixar PDF (A4)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
