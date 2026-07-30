import Link from "next/link";
import { cookies } from "next/headers";
import { getLearnDashCourses, getWooCommerceCurrency, formatWooCommercePrice } from "@/lib/wordpress";
import { handleLogout } from "./actions";
import HeroSection from "@/components/HomePage/HeroSection";
import CourseCategories from "@/components/HomePage/CourseCategories";
import Introduction from "@/components/HomePage/Introduction";
import FeaturedCourses from "@/components/HomePage/FeaturedCourses";
import InteractiveBanner from "@/components/HomePage/InteractiveBanner";
import Statistics from "@/components/HomePage/Statistics";
import Testimonials from "@/components/HomePage/Testimonials";
import Partners from "@/components/HomePage/Partners";
import AccordionSection from "@/components/HomePage/AccordionSection";
import LatestNews from "@/components/HomePage/LatestNews";

export default async function Home() {
  let courses = [];
  let error: string | null = null;
  let isNotConfigured = false;
  let currencyInfo = { currency: "VND", symbol: "₫", position: "right_space" };

  // Kiểm tra phiên đăng nhập của người dùng
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("session_user");
  const user = userCookie ? JSON.parse(userCookie.value) : null;

  // Kiểm tra cấu hình trước khi gọi API
  const username = process.env.WORDPRESS_API_USERNAME;
  const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

  if (
    !username ||
    !password ||
    username === "admin_username_cua_ban" ||
    password.includes("xxxx")
  ) {
    isNotConfigured = true;
  } else {
    try {
      const [coursesData, currencyData] = await Promise.all([
        getLearnDashCourses(),
        getWooCommerceCurrency(),
      ]);
      courses = coursesData;
      currencyInfo = currencyData;
    } catch (err: any) {
      error = err.message || "Không thể kết nối tới WordPress API";
    }
  }

  return (
    <div className="min-h-screen  text-slate-100 font-sans antialiased">
      {/* Banner Hero Section */}
      <HeroSection />

      {/* Danh mục khóa học Section */}
      <CourseCategories />

      <Introduction />
      {/* Background decoration elements */}
      <FeaturedCourses />

      <InteractiveBanner />
      <Statistics />
      <Testimonials />
      <Partners />
      <AccordionSection />
      <LatestNews />

      {/* Header */}


      {/* Main Content */}



    </div>
  );
}
