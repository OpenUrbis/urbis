import { QRCodeSVG } from "qrcode.react";

interface DigitalAddressPlateProps {
  address: string;
  prefix: string;
  code: string;
  latitude?: number;
  longitude?: number;
}

export const DigitalAddressPlate = ({
  address,
  prefix,
  code,
}: DigitalAddressPlateProps) => {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        id="digital-address-plate"
        className="relative w-full aspect-[297/210] bg-[#003399] rounded-2xl print:rounded-none overflow-hidden shadow-xl border-2 border-white/10 flex flex-col p-6 items-center justify-between"
      >
        {/* Header Area - City Logo (Left) and Digital Address Logo (Right) */}
        <div className="flex justify-between items-center w-full">
          <img
            src="/Fundo=Escuro.svg"
            alt="Prefeitura"
            className="h-12 object-contain"
          />
          <img
            src="/endereco_digital_logo.png"
            alt="Endereço Digital"
            className="h-12 brightness-0 invert object-contain"
          />
        </div>

        {/* Main Area - Digital Address Code */}
        <div className="flex flex-col items-center justify-center flex-1">
          <div className="flex flex-col items-start">
            <div className="text-[24px] font-bold text-white/80 tracking-[0.1em] uppercase mb-0 ml-1">
              {prefix}
            </div>
            <div className="text-[92px] font-black text-white tracking-[0.1em] leading-none drop-shadow-2xl">
              {code}
            </div>
          </div>
        </div>

        {/* Footer Area - QR Code */}
        <div className="flex justify-center w-full">
          <div className="bg-white p-2 rounded-xl shadow-inner shrink-0">
            <QRCodeSVG
              value={`https://mapa.urbis.prefeitura.sp.gov.br/?p=${address.replace(/\s/g, "")}`}
              size={77}
              fgColor="#000000"
              level="H"
            />
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium opacity-60 uppercase tracking-widest">
        USO INTERNO DO URBIS - NÃO OFICIAL
      </p>
    </div>
  );
};
