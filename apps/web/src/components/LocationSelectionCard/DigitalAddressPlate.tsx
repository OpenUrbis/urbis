import { QRCodeCanvas } from 'qrcode.react';

interface DigitalAddressPlateProps {
  address: string;
  prefix: string;
  code: string;
  latitude?: number;
  longitude?: number;
}

export const DigitalAddressPlate = ({ address, prefix, code, latitude, longitude }: DigitalAddressPlateProps) => {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
        <div id="digital-address-plate" className="relative w-full aspect-[1.6/1] bg-[#003399] rounded-2xl overflow-hidden shadow-xl border-2 border-white/10 flex flex-col p-6 justify-between">
            
            {/* Header Area */}
            <div className="flex justify-between items-start">
                 <div className="flex flex-col text-white">
                    <span className="text-xl uppercase font-black tracking-[0.15em] mb-0.5">Endereço Digital</span>
                    <span className="text-base font-bold opacity-90">São Paulo - SP</span>
                 </div>
                 <img src="/endereco_digital_logo.png" alt="Logo" className="h-10 brightness-0 invert" />
            </div>

            {/* Main Code Area */}
            <div className="flex flex-col items-center justify-center py-2">
                 <div className="text-sm font-bold text-white/70 uppercase tracking-[0.2em] mb-2">{prefix}</div>
                 <div className="text-[58px] font-black text-white tracking-[0.05em] leading-none drop-shadow-md">{code}</div>
            </div>

            {/* Footer Area */}
            <div className="flex justify-between items-end gap-4">
                 <div className="flex flex-col gap-2 flex-1">
                    <div className="text-base text-white/80 font-mono font-bold tracking-tight">
                        {address}
                    </div>
                    {latitude !== undefined && longitude !== undefined && (
                        <div className="text-xs text-white/60 font-mono font-medium leading-tight">
                            LAT: {latitude.toFixed(6)}°<br/>
                            LON: {longitude.toFixed(6)}°
                            <span className="block text-[10px] text-white/40 font-sans uppercase mt-1 font-bold tracking-wider text-wrap">WGS 84 / GRAUS DECIMAIS</span>
                        </div>
                    )}
                 </div>
                 
                 <div className="bg-white p-2 rounded-lg shadow-inner shrink-0">
                    <QRCodeCanvas value={address} size={90} fgColor="#000000" level="M" />
                 </div>
            </div>
        </div>
        
        <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium opacity-60 uppercase tracking-widest">
            Código único de localização oficial
        </p>
    </div>
  );
};
