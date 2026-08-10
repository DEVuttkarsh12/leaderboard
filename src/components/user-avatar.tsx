"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  avatarUrl: string | null;
  size?: "sm" | "lg";
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function UserAvatar({
  name,
  avatarUrl,
  size = "sm",
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const sizeClasses =
    size === "lg" ? "h-16 w-16 text-sm md:h-[4.5rem] md:w-[4.5rem]" : "h-11 w-11 text-xs";
  const imageSize = size === "lg" ? 72 : 44;

  return (
    <div
      className={cn(
        "avatar-shell flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-[var(--primary-deep)]",
        sizeClasses
      )}
    >
      {avatarUrl && !failed ? (
        <Image
          src={avatarUrl}
          alt="Masked player avatar"
          width={imageSize}
          height={imageSize}
          className="h-full w-full object-cover"
          unoptimized={avatarUrl.endsWith(".gif?size=128")}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}
