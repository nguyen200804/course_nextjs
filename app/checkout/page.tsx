import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLearnDashCourse, checkUserCourseEnrollment, getWooCommerceCustomer, getWooCommerceCheckoutFields, getWooCommerceProductByCourseId, getWooCommercePaymentGateways } from "@/lib/wordpress";
import CheckoutClient from "./checkout-client";

interface PageProps {
  searchParams: Promise<{ courseId?: string; courseSlug?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { courseId, courseSlug } = await searchParams;
  const courseParam = courseSlug || courseId;
  let title = "Thanh toán khóa học - Học viện LMS";
  
  if (courseParam) {
    try {
      const course = await getLearnDashCourse(courseParam);
      if (course?.title?.rendered) {
        title = `Thanh toán: ${course.title.rendered} - Học viện LMS`;
      }
    } catch (_) {}
  }

  return {
    title,
    description: "Trang đăng ký thanh toán và tham gia các khóa học chất lượng cao tại Học viện LMS.",
  };
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const { courseId, courseSlug } = await searchParams;
  const courseParam = courseSlug || courseId;

  // 1. Kiểm tra session đăng nhập
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("session_user");
  const user = userCookie ? JSON.parse(userCookie.value) : null;

  if (!user) {
    // Nếu chưa đăng nhập, chuyển hướng sang trang login và ghi nhớ URL redirect
    redirect(courseParam ? `/login?redirect=/checkout?${courseSlug ? `courseSlug=${courseSlug}` : `courseId=${courseId}`}` : "/login");
  }

  if (!courseParam) {
    return (
      <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 mx-auto text-xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-amber-300 mb-3">Thiếu thông tin khóa học</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Không tìm thấy thông tin khóa học yêu cầu thanh toán. Vui lòng quay lại danh sách khóa học.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-purple-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  let course: any = null;
  let isEnrolled = false;
  let customer: any = null;
  let fieldsConfig: any = null;
  let paymentGateways: any[] = [];
  let errorMsg: string | null = null;

  try {
    // 2. Fetch thông tin khóa học bằng courseParam (slug hoặc id)
    course = await getLearnDashCourse(courseParam);
    const actualCourseId = course.id.toString();

    const [enrolledStatus, customerData, gatewaysData] = await Promise.all([
      checkUserCourseEnrollment(user.id.toString(), actualCourseId),
      getWooCommerceCustomer(user.id.toString()).catch((err) => {
        console.error("Lỗi khi tải thông tin khách hàng từ WooCommerce:", err);
        return null;
      }),
      getWooCommercePaymentGateways().catch((err) => {
        console.error("Lỗi khi tải danh sách cổng thanh toán:", err);
        return [];
      }),
    ]);

    isEnrolled = enrolledStatus;
    customer = customerData;
    paymentGateways = gatewaysData;

    // Tìm product ID từ WooCommerce hoặc fallback sang custom_button_url
    let productId = null;
    const wcProduct = await getWooCommerceProductByCourseId(actualCourseId);
    if (wcProduct) {
      productId = wcProduct.id;
    } else {
      const match = course?.custom_button_url?.match(/add-to-cart=(\d+)/);
      productId = match ? parseInt(match[1]) : null;
    }

    if (productId) {
      fieldsConfig = await getWooCommerceCheckoutFields(productId);
    }
  } catch (err: any) {
    errorMsg = err.message || "Không thể tải dữ liệu khóa học.";
  }

  // 3. Nếu người dùng đã kích hoạt khóa học này rồi, chuyển thẳng họ tới học
  if (isEnrolled && course) {
    redirect(`/courses/${course.slug || course.id}`);
  }

  if (errorMsg || !course) {
    return (
      <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6 mx-auto text-xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-red-300 mb-3">Lỗi tải khóa học</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{errorMsg}</p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-purple-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 font-sans antialiased">
      {/* Background decoration elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/courses/${course.slug || course.id}`} className="flex items-center gap-2 group text-slate-400 hover:text-white transition-colors">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span className="text-sm font-semibold">Quay lại khóa học</span>
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Secure Native Checkout
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-10 text-left">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Thanh toán khóa học
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Đăng ký tham gia trực tuyến và mở khóa tài liệu học tập ngay lập tức.
          </p>
        </div>

        <CheckoutClient course={course} user={user} customer={customer} fieldsConfig={fieldsConfig} paymentGateways={paymentGateways} />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-900 py-8 bg-slate-950/80">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-600 font-medium">
          Dự án tích hợp Next.js & LearnDash WordPress REST API. Bảo mật bằng Basic Authentication.
        </div>
      </footer>
    </div>
  );
}
