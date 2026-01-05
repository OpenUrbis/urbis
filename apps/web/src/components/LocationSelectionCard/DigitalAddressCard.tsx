import { cn } from "@open-urbis/map-ui";

interface DigitalAddressCardProps {
  prefix: string;
  code: string;
  address: string;
  className?: string;
}

export const DigitalAddressCard = ({ prefix, code, address, className }: DigitalAddressCardProps) => {
  return (
    <div className={cn("bg-primary/5 p-4 rounded-xl border border-primary/20 text-center shadow-sm", className)}>
      <span className="block text-xs font-bold text-primary mb-1 uppercase tracking-widest">Endereço Digital</span>
      <span className="text-2xl font-mono font-bold tracking-wider text-foreground whitespace-nowrap overflow-x-auto block">
        {address}
      </span>
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-primary/10">
         <div className="flex flex-col">
           <span className="text-[10px] text-muted-foreground uppercase">Prefixo</span>
           <span className="text-xs font-mono">{prefix}</span>
         </div>
         <div className="flex flex-col">
           <span className="text-[10px] text-muted-foreground uppercase">Sufixo</span>
           <span className="text-xs font-mono">{code}</span>
         </div>
      </div>
    </div>
  );
};
