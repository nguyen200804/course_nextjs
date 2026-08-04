import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLearnDashCourse, checkUserCourseEnrollment, getWooCommerceCustomer, getWooCommerceCheckoutFields, getWooCommerceProductByCourseId, getWooCommercePaymentGateways } from "@/lib/wordpress";
import CheckoutClient from "./checkout-client";
import styles from "@/styles/CheckoutPage.module.css";

interface PageProps {
  searchParams: Promise<{ courseId?: string; courseSlug?: string; course_id?: string; course_slug?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const { courseId, courseSlug, course_id, course_slug } = await searchParams;
  const courseParam = courseSlug || course_slug || courseId || course_id;
  let title = "Course Checkout - LMS Academy";

  if (courseParam) {
    try {
      const course = await getLearnDashCourse(courseParam);
      if (course?.title?.rendered) {
        title = `Checkout: ${course.title.rendered} - LMS Academy`;
      }
    } catch (_) { }
  }

  return {
    title,
    description: "Course registration and checkout page for high-quality courses at LMS Academy.",
  };
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const { courseId, courseSlug, course_id, course_slug } = await searchParams;
  const courseParam = courseSlug || course_slug || courseId || course_id;

  // 1. Check user login session
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("session_user");
  const user = userCookie ? JSON.parse(userCookie.value) : null;

  if (!user) {
    const activeSlug = courseSlug || course_slug;
    const activeId = courseId || course_id;
    const redirectQuery = activeSlug ? `courseSlug=${activeSlug}` : `courseId=${activeId}`;
    redirect(courseParam ? `/login?redirect=/checkout?${redirectQuery}` : "/login");
  }

  if (!courseParam) {
    return (
      <div className={`${styles.checkoutContainer} ${styles.errorCardContainer}`}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            ⚠️
          </div>
          <h2 className={styles.errorTitle}>Missing Course Information</h2>
          <p className={styles.errorText}>
            Course information required for checkout was not found. Please return to the course list.
          </p>
          <Link href="/" className={styles.errorBtn}>
            Back to Home
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
        console.error("Error loading customer details from WooCommerce:", err);
        return null;
      }),
      getWooCommercePaymentGateways().catch((err) => {
        console.error("Error loading payment gateways list:", err);
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
    errorMsg = err.message || "Failed to load course data.";
  }

  // 3. Nếu người dùng đã kích hoạt khóa học này rồi, chuyển thẳng họ tới học
  if (isEnrolled && course) {
    redirect(`/courses/${course.slug || course.id}`);
  }

  if (errorMsg || !course) {
    return (
      <div className={`${styles.checkoutContainer} ${styles.errorCardContainer}`}>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}>
            ⚠️
          </div>
          <h2 className={styles.errorTitle}>Error Loading Course</h2>
          <p className={styles.errorText}>{errorMsg}</p>
          <Link href="/" className={styles.errorBtn}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutContainer}>
      {/* Background decoration elements */}

      {/* Main Content */}
      <main className={styles.checkoutMain}>
        <div className={styles.checkoutTitleWrapper}>
          <h1 className={styles.checkoutTitle}>
            Course Checkout
          </h1>
          <p className={styles.checkoutSubtitle}>
            Enroll online and unlock learning materials instantly.
          </p>
        </div>

        <CheckoutClient course={course} user={user} customer={customer} fieldsConfig={fieldsConfig} paymentGateways={paymentGateways} />
      </main>
    </div>
  );
}
