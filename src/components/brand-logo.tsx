import Image from "next/image";
import { assetPath } from "@/lib/asset";

export function BrandLogo({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <span className={`relative block shrink-0 ${compact ? "h-12 w-16" : "h-16 w-24"} ${inverse ? "" : "rounded-sm bg-[#073f8c] shadow-sm"}`}>
      <Image src={assetPath("/brand/casa-sao-jose-logo.webp")} alt="Casa São José Acabamentos" fill sizes={compact ? "64px" : "96px"} className="object-contain" priority />
    </span>
  );
}
