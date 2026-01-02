import { encode, getPolygon, getAddressMetrics } from '@open-urbis/numeracao-digital';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DigitalAddressPlate } from "./DigitalAddressPlate";
import { DigitalAddressCard } from "./DigitalAddressCard";
import { useNavigationContext } from "../../hooks/useNavigationContext";
import { useMapContext } from "../../hooks/useMapContext";
// @ts-ignore
import html2canvas from "html2canvas";
// @ts-ignore
import jsPDF from "jspdf";

interface DigitalAddressDetailsProps {
  latitude: number;
  longitude: number;
  plusCode?: string;
}

export const DigitalAddressDetails = ({ latitude, longitude, plusCode }: DigitalAddressDetailsProps) => {
  const { navigatePop } = useNavigationContext();
  const { digitalAddressFeature } = useMapContext();
  const address = encode(latitude, longitude);
  const polygon = getPolygon(address);
  const metrics = getAddressMetrics(address);
  const [prefix, code] = address.split(' ');

  const handleDownloadPDF = async () => {
    const element = document.getElementById('digital-address-plate');
    if (!element) return;
    
    try {
        const canvas = await html2canvas(element, { scale: 4, useCORS: true });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = 180; 
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
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
              navigatePop();
            }}
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Button>
          <CardTitle className="text-lg font-bold">Endereço Digital</CardTitle>
        </div>
        <img src="/endereco_digital_logo.png" alt="Logo Endereço Digital" className="h-8" />
      </CardHeader>
      <CardContent className="p-4 space-y-6">
        
        {/* Códigos (Moved to Top) */}
        <div className="space-y-3">
          {/* Digital Address */}
          <DigitalAddressCard prefix={prefix} code={code} address={address} />

          {/* Plus Code */}
          {plusCode && (
             <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-center shadow-sm">
                <span className="block text-xs font-bold text-primary mb-1 uppercase tracking-widest">Plus Code (Google)</span>
                <span className="text-xl font-mono font-bold tracking-wide text-foreground block">
                  {plusCode}
                </span>
             </div>
          )}
        </div>

        {/* Espaço Representado */}
        <div className="space-y-2 pt-2 border-t">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Coordenadas</h3>
          <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-md border border-border/50">
            <div>
              <span className="block text-[10px] uppercase font-medium text-muted-foreground mb-1">Latitude</span>
              <span className="font-mono text-sm">{latitude.toFixed(5)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-medium text-muted-foreground mb-1">Longitude</span>
              <span className="font-mono text-sm">{longitude.toFixed(5)}</span>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Métricas da Área</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Face N:</span>
                <span className="font-medium">{metrics.faces[0].toFixed(2)} m</span>
            </div>
            <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Face E:</span>
                <span className="font-medium">{metrics.faces[1].toFixed(2)} m</span>
            </div>
            <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Face S:</span>
                <span className="font-medium">{metrics.faces[2].toFixed(2)} m</span>
            </div>
            <div className="flex justify-between border-b pb-1">
                <span className="text-muted-foreground">Face O:</span>
                <span className="font-medium">{metrics.faces[3].toFixed(2)} m</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2 font-medium bg-muted/20 p-2 rounded">
             <span>Área Total</span>
             <span className="text-primary font-bold">{metrics.area.toFixed(2)} m²</span>
          </div>
        </div>

        {/* Polígono (Moved down and minimized) */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vértices (Debug)</h3>
          <pre className="text-[9px] bg-muted/50 p-2 rounded border border-border/30 overflow-x-auto font-mono text-muted-foreground">
            {polygon.map(p => `${p.lat.toFixed(6)}, ${p.lon.toFixed(6)}`).join('\n')}
          </pre>
        </div>

        <div className="pt-2">
           <Dialog>
             <DialogTrigger asChild>
               <Button className="w-full rounded-full font-semibold shadow-sm">
                 <span className="material-symbols-outlined mr-2 text-lg">directions_car</span>
                 Gerar Placa Virtual
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-2xl bg-slate-50">
               <DialogHeader>
                 <DialogTitle>Placa Virtual</DialogTitle>
               </DialogHeader>
               <div className="flex flex-col items-center justify-center p-6 gap-6 w-full">
                 <DigitalAddressPlate address={address} prefix={prefix} code={code} />
                 
                 <Button onClick={handleDownloadPDF} variant="default" className="w-full max-w-sm rounded-full">
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
