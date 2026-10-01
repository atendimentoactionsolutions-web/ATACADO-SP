import React from "react";

interface AppleLogoProps {
  className?: string;
  variant?: "white" | "black";
  alt?: string;
}

export default function AppleLogo({
  className = "w-5 h-5",
  variant = "white",
  alt = "Apple",
}: AppleLogoProps) {
  const src = variant === "white" ? "/apple-white.png" : "/apple-black.png";
  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain shrink-0 ${className}`}
      draggable={false}
    />
  );
}
