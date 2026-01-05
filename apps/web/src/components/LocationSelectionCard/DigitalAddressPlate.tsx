import { QRCodeCanvas } from 'qrcode.react';

interface DigitalAddressPlateProps {
  address: string;
  prefix: string;
  code: string;
  utm?: { x: number; y: number };
}

export const DigitalAddressPlate = ({ address, prefix, code, utm }: DigitalAddressPlateProps) => {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
        <div id="digital-address-plate" className="relative w-full aspect-[1.6/1] bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            {/* Header - Blue */}
            <div className="bg-[#003399] px-6 py-4 flex justify-between items-center h-20 shrink-0">
                 <div className="flex flex-col text-white">
                    <span className="text-xs uppercase font-bold tracking-widest opacity-90">Endereço Digital</span>
                    <span className="text-xs opacity-80">São Paulo - SP</span>
                 </div>
                 <img src="/endereco_digital_logo.png" alt="Logo" className="h-10 brightness-0 invert" />
            </div>

            {/* Body */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
                 <div className="text-lg font-medium text-slate-500 uppercase tracking-widest mb-2">{prefix}</div>
                 <div className="text-5xl md:text-6xl font-black text-slate-800 tracking-widest leading-none">{code}</div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-end px-6 py-4 bg-white border-t border-gray-100 shrink-0">
                 <div className="flex flex-col gap-1">
                    <div className="text-xs text-slate-400 font-mono">
                        {address}
                    </div>
                    {utm && (
                        <div className="text-[10px] text-slate-500 font-mono font-medium">
                            E: {utm.x.toFixed(2)} N: {utm.y.toFixed(2)}
                            <span className="block text-[8px] text-slate-400 font-sans uppercase mt-0.5">SIRGAS 2000 / UTM 23S</span>
                        </div>
                    )}
                 </div>
                 <div className="border border-gray-100 p-1.5 rounded bg-white">
                    <QRCodeCanvas value={address} size={64} fgColor="#000000" />
                 </div>
            </div>
        </div>
        
        <p className="text-xs text-muted-foreground text-center max-w-[300px] leading-tight">
            Código único de localização oficial.
        </p>
    </div>
  );
};
