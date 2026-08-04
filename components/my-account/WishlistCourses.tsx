"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import CourseCard from "@/components/common/CourseCard";
import styles from "@/styles/my-account/MyCourses.module.css";

export default function WishlistCourses() {
  const { wishlist, loading: wishlistLoading } = useWishlist();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistCourseDetails = async () => {
      if (wishlist.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://test4.questx.com.vn";
        const res = await fetch(
          `${wpUrl}/wp-json/wp/v2/lp_course?include=${wishlist.join(",")}&_embed=1&per_page=100`,
          { cache: "no-store" }
        );

        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết khóa học yêu thích:", err);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    if (!wishlistLoading) {
      fetchWishlistCourseDetails();
    }
  }, [wishlist, wishlistLoading]);

  const isPageLoading = wishlistLoading || loading;

  return (
    <div className={styles.myCoursesContainer}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
        <Heart color="#ef4444" fill="#ef4444" size={24} />
        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, fontFamily: "var(--font-spartan)" }}>
          Wishlist ({wishlist.length})
        </h2>
      </div>

      {isPageLoading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "4rem 0" }}>
          <Loader2 className="animate-spin" size={32} color="#1ab69d" />
        </div>
      ) : courses.length === 0 ? (
        <div style={{ padding: "4rem 1rem", border: "1px dashed #d8d8d8", borderRadius: "12px", textAlign: "center" }}>
          <Heart size={48} color="#94a3b8" style={{ margin: "0 auto 1rem auto" }} />
          <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#181818", marginBottom: "0.5rem" }}>
            Your Wishlist is Empty
          </h3>
          <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "1.5rem" }}>
            Explore our courses and save your favorite ones to learn later!
          </p>
          <Link
            href="/courses"
            style={{
              display: "inline-flex",
              height: "44px",
              padding: "0 24px",
              borderRadius: "6px",
              background: "#1ab69d",
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
          {courses.map((course) => {
            const title = course.title?.rendered || "";
            const featuredImg =
              course._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
              "https://demo.edublink.co/wp-content/uploads/2023/03/course-04-590x430.jpg";

            return (
              <CourseCard
                key={course.id}
                id={course.id}
                title={title}
                imgSrc={featuredImg}
                slug={course.slug || course.id.toString()}
                link={`/courses/${course.slug || course.id}`}
                _lp_price={course._lp_price || course.meta?._lp_price}
                _lp_sale_price={course._lp_sale_price || course.meta?._lp_sale_price}
                _lp_regular_price={course._lp_regular_price || course.meta?._lp_regular_price}
                price={course.price}
                originPrice={course.regular_price}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
