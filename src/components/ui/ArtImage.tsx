import { getImageProps } from "next/image";
import { media } from "@/lib/data/media";

/**
 * Art-directed photograph: a landscape image for tablets/desktop and a portrait image for phones,
 * both served responsively through the image optimiser. Server component.
 */
export function ArtImage({
  desktop,
  mobile,
  alt,
  className,
  sizes = "100vw",
  priority = false,
}: {
  desktop: string;
  mobile?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const d = media(desktop);
  const m = media(mobile ?? desktop);
  const common = { alt, sizes, quality: 82, ...(priority ? { priority: true } : { loading: "lazy" as const }) };
  const { props: dp } = getImageProps({ ...common, src: d.src, width: d.width, height: d.height });
  const { props: mp } = getImageProps({ ...common, src: m.src, width: m.width, height: m.height });
  const { srcSet: desktopSet, ...img } = dp;
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mp.srcSet} sizes={sizes} />
      <source media="(min-width: 768px)" srcSet={desktopSet} sizes={sizes} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is supplied via getImageProps */}
      <img {...img} className={className} style={{ backgroundImage: d.blurDataURL ? `url(${d.blurDataURL})` : undefined, backgroundSize: "cover" }} />
    </picture>
  );
}
