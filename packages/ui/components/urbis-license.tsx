import { cn } from "../lib/utils";

export type UrbisLicenseSummaryVariant = "footer" | "modal";

type UrbisLicenseSummaryProps = {
  variant?: UrbisLicenseSummaryVariant;
  className?: string;
  showTitle?: boolean;
};

const licenseLinks = {
  agpl: "/license/agpl-v3.html",
  ccBySa: "/license/cc-by-sa-4.0.html",
};

export function UrbisLicenseSummary({
  variant = "footer",
  className,
  showTitle = true,
}: UrbisLicenseSummaryProps) {
  const isFooter = variant === "footer";

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center text-center gap-1",
        className,
      )}
    >
      {showTitle && (
        <p
          className={cn(
            "font-bold leading-tight tracking-tight whitespace-nowrap",
            isFooter
              ? "text-[22px] md:text-[26px] text-primary-foreground"
              : "text-[15px] text-muted-foreground",
          )}
        >
          ©{" "}
          <a
            href="https://prefeitura.sp.gov.br/"
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Município de São Paulo
          </a>
        </p>
      )}

      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-medium whitespace-nowrap",
          isFooter ? "text-[14px] md:text-[14px]" : "text-xs",
        )}
      >
        <a
          href={licenseLinks.agpl}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex items-center gap-1 hover:underline",
            isFooter ? "text-primary-foreground" : "text-foreground",
          )}
        >
          <span className="inline-block -scale-x-100" aria-hidden="true">
            ©
          </span>
          <span>AGPL v3</span>
          <span className="font-normal text-[12px]">(software)</span>
        </a>

        <a
          href={licenseLinks.ccBySa}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex items-center gap-1 hover:underline",
            isFooter ? "text-primary-foreground" : "text-foreground",
          )}
        >
          <img
            src="/cc.svg"
            className="w-4 h-4"
            alt=""
            aria-hidden="true"
          />
          <img
            src="/by.svg"
            className="w-4 h-4"
            alt=""
            aria-hidden="true"
          />
          <img
            src="/sa.svg"
            className="w-4 h-4"
            alt=""
            aria-hidden="true"
          />

          <span>CC BY-SA 4.0</span>
          <span className="font-normal text-[12px]">(outros)</span>
        </a>
      </div>
    </div>
  );
}
