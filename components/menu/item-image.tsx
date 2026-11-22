import Image from "next/image";
import { CATEGORY_EMOJI } from "@/lib/constants";
import { cn } from "@/lib/cn";
import type { CategorySlug } from "@/types/menu";

type Props = {
  imageUrl: string | null;
  category: CategorySlug;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

/** Item photo, or a soft placeholder tile until an image is uploaded. */
export function ItemImage({ imageUrl, category, alt, sizes, className, priority }: Props) {
  return (
    <div className={cn("relative overflow-hidden bg-brand-100", className)}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center bg-linear-to-br from-brand-100 to-accent-soft text-3xl"
        >
          {CATEGORY_EMOJI[category]}
        </div>
      )}
    </div>
  );
}
