import { useState, type ImgHTMLAttributes } from "react";
import { ImageOff } from "lucide-react";
import { imageSrc, imageSrcSet } from "../../lib/format";

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string;
  alt: string;
  width?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Classes for the wrapper that reserves space (prevents layout shift). */
  frameClassName?: string;
}

/** Responsive image with reserved aspect frame, fade-in and a graceful broken-image state. */
export function Img({ src, alt, width = 1200, sizes = "100vw", priority, className = "", frameClassName = "", ...rest }: Props) {
  const [loaded, setLoaded] = useState(false);
  // 0 = first attempt, 1 = one retry without srcset (transient CDN/network errors), 2 = give up
  const [attempt, setAttempt] = useState(0);
  const failed = attempt >= 2;
  const base = imageSrc(src, width);
  const retrySrc = `${base}${base.includes("?") ? "&" : "?"}retry=1`;
  return (
    <div className={`relative overflow-hidden bg-[#e9edf3] ${frameClassName}`}>
      {failed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted" role="img" aria-label={alt}>
          <ImageOff className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs">Image unavailable</span>
        </div>
      ) : (
        <img
          src={attempt === 0 ? base : retrySrc}
          srcSet={attempt === 0 ? imageSrcSet(src) : undefined}
          sizes={sizes}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setAttempt((a) => a + 1)}
          className={`h-full w-full object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-premium)] ${
            loaded ? "opacity-100" : "opacity-0"
          } ${className}`}
          {...rest}
        />
      )}
    </div>
  );
}
