import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  // variant kept for API compatibility but no longer affects image styling
  variant?: "light" | "dark";
}

const SIZE_MAP = {
  sm:  { width: 110, height: 36 },
  md:  { width: 140, height: 46 },
  lg:  { width: 170, height: 56 },
};

export function Logo({ className, size = "md" }: LogoProps) {
  const dims = SIZE_MAP[size];

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center", className)}
    >
      <Image
        src="/logo.png?v=2"
        alt="Evaan Jewels"
        width={dims.width}
        height={dims.height}
        className="object-contain"
        priority
        unoptimized
      />
    </Link>
  );
}
