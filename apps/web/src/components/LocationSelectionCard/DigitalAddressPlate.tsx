import { QRCodeSVG } from "qrcode.react";

interface DigitalAddressPlateProps {
  address: string;
  prefix: string;
  code: string;
}

export const DigitalAddressPlate = ({
  address,
  prefix,
  code,
}: DigitalAddressPlateProps) => {
  const displayPrefix = prefix.startsWith("(") ? prefix : `(${prefix})`;

  return (
    <div className="flex w-full flex-col items-center gap-[2cqw] [container-type:inline-size]">
      <div
        id="digital-address-plate"
        className="relative aspect-[297/210] w-full overflow-hidden bg-[#003399] font-sans shadow-xl print:rounded-none [container-type:inline-size]"
      >
        {/* Header */}
        <div className="absolute left-[8%] right-[8%] top-[6%] z-10 flex items-start justify-between gap-[5%]">
          <img
            src="/Fundo=Escuro.svg"
            alt="Prefeitura de São Paulo"
            className="h-[8.6cqw] object-contain"
          />
          <img
            src="/endereco_digital_logo.png"
            alt="Endereço Digital"
            className="h-[6.7cqw] object-contain brightness-0 invert"
          />
        </div>

        {/* Main Code Area */}
        <div className="absolute left-[6%] right-[6%] top-[20%] text-[6.2cqw] font-semibold italic leading-none text-white">
          {displayPrefix}
        </div>
        <div
          id="digital-address-plate-code"
          className="absolute left-[6%] right-[6%] top-[30.2%] whitespace-nowrap line-height-[0%] text-[18.1cqw] font-black leading-none tracking-[0.01em] text-white drop-shadow-lg"
        >
          {code}
        </div>

        {/* Footer Melhorado */}
        <div className="absolute bottom-[4%] left-[6%] right-[6%] z-10 flex h-[15.2cqw] items-end justify-between">
          {/* Texto à esquerda - sem quebra de linha */}
          <span className="whitespace-nowrap text-[1.9cqw] font-semibold uppercase leading-[1.35] tracking-[0.18em] text-white/55">
            USO INTERNO DO URBIS
            <br />
            NÃO OFICIAL
          </span>

          {/* QR Code centralizado com padding */}
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
            <div className="h-[17.8cqw] w-[17.8cqw] bg-white p-[1.55cqw] shadow-inner">
              <QRCodeSVG
                value={`https://mapa.urbis.prefeitura.sp.gov.br/?p=${address.replace(/\s/g, "")}`}
                size={256}
                fgColor="#000000"
                level="H"
                className="block h-full w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Legenda externa */}
      <p className="mt-[1cqw] text-center text-[max(9px,2cqw)] font-medium uppercase tracking-widest text-muted-foreground opacity-70">
        USO INTERNO DO URBIS - NÃO OFICIAL
      </p>
    </div>
  );
};
