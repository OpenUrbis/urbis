import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@open-urbis/map-ui';

interface HeaderWithInfoProps {
  title: string;
  tooltipText: string;
  link?: string;
  linkText?: string;
  className?: string;
  isMainHeader?: boolean;
}

export function HeaderWithInfo({
  title,
  tooltipText,
  link,
  linkText = 'Abrir mais ajuda',
  className = '',
  isMainHeader = false,
}: HeaderWithInfoProps) {
  const HeaderTag = isMainHeader ? 'h2' : 'h3';
  const baseClasses = isMainHeader 
    ? 'text-lg font-semibold dark:text-white' 
    : 'text-base font-semibold tracking-tight';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <HeaderTag className={baseClasses}>{title}</HeaderTag>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="text-muted-foreground hover:text-primary transition-colors focus:outline-none">
              <Info className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[250px] p-3 space-y-2 bg-background border-border shadow-lg" side="right">
            <p className="text-xs text-foreground font-normal leading-relaxed">{tooltipText}</p>
            {link && (
              <a 
                href={link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-primary hover:underline block mt-1"
              >
                {linkText}
              </a>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
