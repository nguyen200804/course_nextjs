"use client";

import { useState, useEffect, useCallback } from "react";

export function useWishlist() {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch(`/api/wishlist?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.wishlist)) {
          setWishlist(data.wishlist.map((id: any) => Number(id)));
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải Wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();

    const onFocus = () => {
      fetchWishlist();
    };

    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchWishlist]);

  const toggleWishlist = async (courseId: number) => {
    const numericId = Number(courseId);
    const isCurrentlyWishlisted = wishlist.includes(numericId);

    // Optimistic UI update
    setWishlist((prev) =>
      isCurrentlyWishlisted
        ? prev.filter((id) => id !== numericId)
        : [...prev, numericId]
    );

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: numericId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.wishlist)) {
          setWishlist(data.wishlist.map((id: any) => Number(id)));
        }
      }
    } catch (err) {
      console.error("Lỗi khi cập nhật Wishlist:", err);
      // Revert on error
      fetchWishlist();
    }
  };

  const isWishlisted = (courseId: number) => wishlist.includes(Number(courseId));

  return {
    wishlist,
    loading,
    toggleWishlist,
    isWishlisted,
    refreshWishlist: fetchWishlist,
  };
}
