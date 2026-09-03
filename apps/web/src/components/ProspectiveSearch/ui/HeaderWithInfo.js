import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@open-urbis/map-ui";
export function HeaderWithInfo({ title, tooltipText, link, linkText = "Abrir mais ajuda", className = "", isMainHeader = false, }) {
    const HeaderTag = isMainHeader ? "h2" : "h3";
    const baseClasses = isMainHeader
        ? "text-lg font-semibold dark:text-white"
        : "text-base font-semibold tracking-tight";
    return (_jsxs("div", { className: `flex items-center gap-2 ${className}`, children: [_jsx(HeaderTag, { className: baseClasses, children: title }), _jsx(TooltipProvider, { delayDuration: 200, children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("button", { className: "text-muted-foreground hover:text-primary transition-colors focus:outline-none", children: _jsx(Info, { className: "w-4 h-4" }) }) }), _jsxs(TooltipContent, { className: "max-w-[250px] p-3 space-y-2 bg-background border-border shadow-lg", side: "right", children: [_jsx("p", { className: "text-xs text-foreground font-normal leading-relaxed", children: tooltipText }), link && (_jsx("a", { href: link, target: "_blank", rel: "noopener noreferrer", className: "text-[11px] font-medium text-primary hover:underline block mt-1", children: linkText }))] })] }) })] }));
}
