"use client";

import Image from "next/image";
import { CircleUserRound } from "lucide-react";
import { useState } from "react";

/** Decorative avatar contents; the player name is rendered beside the avatar. */
export default function AvatarContent({
  src,
  size = 44,
}: {
  src?: string | null;
  size?: number;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return src && src !== failedSrc ? (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className="avatar-content__image"
      unoptimized
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  ) : (
    <CircleUserRound className="avatar-content__fallback" aria-hidden="true" />
  );
}
