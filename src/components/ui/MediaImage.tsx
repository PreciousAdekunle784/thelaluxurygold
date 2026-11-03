import Image, { type ImageProps } from "next/image";
import { media } from "@/lib/data/media";

/** next/image bound to the media registry, with blur-up placeholders. */
export function MediaImage({
  mediaKey,
  alt,
  fill = true,
  priority,
  ...props
}: Omit<ImageProps, "src" | "width" | "height" | "placeholder" | "blurDataURL" | "alt" | "priority"> & { mediaKey: string; alt: string; priority?: boolean }) {
  const m = media(mediaKey);
  const sizing = fill ? { fill: true as const } : { width: m.width, height: m.height };
  return (
    <Image
      src={m.src}
      alt={alt}
      {...sizing}
      placeholder={m.blurDataURL ? "blur" : "empty"}
      blurDataURL={m.blurDataURL}
      {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
      {...props}
    />
  );
}
