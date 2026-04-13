"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  id?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  withText?: boolean;
  textClassName?: string;
  href?: string;
}

export default function Logo({
  id,
  size = "md",
  className = "",
  withText = false,
  textClassName = "",
  href,
}: LogoProps) {
  const sizes = {
    sm: { container: "w-7 h-7", icon: 18 },
    md: { container: "w-9 h-9", icon: 24 },
    lg: { container: "w-12 h-12", icon: 32 },
    xl: { container: "w-20 h-20", icon: 56 },
  };

  const LogoContent = (
    <div id={id} className={`flex items-center gap-2.5 group ${className}`}>
      <div 
        className={`${sizes[size].container} rounded-xl bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300 overflow-hidden shadow-inner`}
      >
        <Image
          src="/logo.png"
          alt="MyLearning Logo"
          width={sizes[size].icon}
          height={sizes[size].icon}
          className="object-contain"
          priority
        />
      </div>
      {withText && (
        <span className={`text-xl font-bold ${textClassName}`}>
          <span className="gradient-text">My</span>
          <span className="text-white">Learning</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{LogoContent}</Link>;
  }

  return LogoContent;
}
