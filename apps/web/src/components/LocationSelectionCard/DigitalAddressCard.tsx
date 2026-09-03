import { cn } from "@open-urbis/map-ui";

interface DigitalAddressCardProps {
  prefix: string;
  code: string;
  address: string;
  className?: string;
}

export const DigitalAddressCard = ({
  prefix,
  code,
  address,
  className,
}: DigitalAddressCardProps) => {
  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/50 p-3 text-center shadow-sm",
        className,
      )}
    >
      <span className="mb-0.5 block text-sm font-semibold leading-tight text-foreground">
        Endereço completo
      </span>
      <span className="block overflow-x-auto whitespace-nowrap text-2xl font-semibold tracking-wide text-foreground">
        {address}
      </span>
      <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">
            Prefixo
          </span>
          <span className="text-sm font-semibold text-foreground">
            {prefix}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-muted-foreground">
            Endereço Digital
          </span>
          <span className="text-sm font-semibold text-foreground">{code}</span>
        </div>
      </div>
    </div>
  );
};
