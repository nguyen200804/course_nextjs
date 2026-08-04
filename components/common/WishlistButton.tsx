"use client";

import React from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import btnStyles from "./WishlistButton.module.css";

interface WishlistButtonProps {
  courseId: number;
  className?: string;
  activeClassName?: string;
  showText?: boolean;
  text?: string;
  activeText?: string;
  style?: React.CSSProperties;
}

export default function WishlistButton({
  courseId,
  className = "",
  activeClassName = "",
  showText = false,
  text = "Add to Wishlist",
  activeText = "Remove from Wishlist",
  style,
}: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const active = isWishlisted(courseId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(courseId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={style}
      className={`${btnStyles.wishlistButton} ${active ? btnStyles.active : ""} ${className} ${active ? activeClassName : ""}`}
      title={active ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart size={20} style={{ flexShrink: 0 }} />
      {showText && <span>{active ? activeText : text}</span>}
    </button>
  );
}
