import Image from "next/image";

export function DronesPhoto({
  src,
  alt,
  className,
  sizes = "100vw",
  preload = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      unoptimized
      className={className ?? "dr-photo"}
    />
  );
}
