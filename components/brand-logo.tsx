"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Centralized app branding. Renders the logo lockup from
 * `public/assets/header_logo.svg`. The image already contains the wordmark, so
 * no separate text label is drawn. If the file is missing it falls back to the
 * "W" mark + "WeLoan365" so the UI never shows a broken image.
 *
 * `size` is the rendered height in px (the image keeps its aspect ratio).
 */
export function BrandLogo({
  size = 32,
  withName = true,
  tone = "brand",
  className,
}: {
  size?: number;
  withName?: boolean;
  tone?: "brand" | "light";
  className?: string;
}) {
  const [imgOk, setImgOk] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Catch an image that already failed before React hydrated (so onError
  // never ran): a "complete" image with zero natural width is broken.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setImgOk(false);
  }, []);

  if (imgOk) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={imgRef}
        src="/assets/header_logo.svg"
        alt="WeLoan365"
        onError={() => setImgOk(false)}
        style={{ height: size }}
        className={cn("w-auto object-contain", className)}
      />
    );
  }

  // Fallback lockup (only shown if the image is unavailable).
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "rounded-lg flex items-center justify-center font-bold flex-shrink-0",
          tone === "light" ? "bg-white/10 text-white backdrop-blur-sm" : "bg-brand-600 text-white"
        )}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}
      >
        W
      </span>
      {withName && (
        <span className={cn("font-semibold", tone === "light" ? "text-white" : "text-gray-900")}>
          WeLoan365
        </span>
      )}
    </span>
  );
}
