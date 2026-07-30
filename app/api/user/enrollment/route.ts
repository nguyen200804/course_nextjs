import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { checkUserCourseEnrollment } from "@/lib/wordpress";

// GET: Kiểm tra người dùng đã ghi danh (enrolled) khóa học hay chưa
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("course_id");

    if (!courseId) {
      return NextResponse.json({ isEnrolled: false });
    }

    const cookieStore = await cookies();
    const sessionUserCookie = cookieStore.get("session_user")?.value;

    if (!sessionUserCookie) {
      return NextResponse.json({ isEnrolled: false });
    }

    let sessionUser: { id: number; username: string } | null = null;
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {
      return NextResponse.json({ isEnrolled: false });
    }

    if (!sessionUser?.id) {
      return NextResponse.json({ isEnrolled: false });
    }

    const isEnrolled = await checkUserCourseEnrollment(String(sessionUser.id), String(courseId));
    return NextResponse.json({ isEnrolled });
  } catch (error) {
    console.error("Lỗi kiểm tra enrollment:", error);
    return NextResponse.json({ isEnrolled: false });
  }
}

// POST: Đăng ký (Enroll) vào khóa học (Start Now) - Đồng bộ dữ liệu sang WordPress LearnPress
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionUserCookie = cookieStore.get("session_user")?.value;

    if (!sessionUserCookie) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để bắt đầu học." }, { status: 401 });
    }

    let sessionUser: { id: number; username: string } | null = null;
    try {
      sessionUser = JSON.parse(sessionUserCookie);
    } catch {
      return NextResponse.json({ error: "Phiên đăng nhập không hợp lệ." }, { status: 401 });
    }

    const { course_id } = await request.json();
    if (!course_id) {
      return NextResponse.json({ error: "Thiếu ID khóa học." }, { status: 400 });
    }

    const wpUrl = process.env.WORDPRESS_URL || "https://test4.questx.com.vn";

    if (wpUrl && sessionUser?.id) {
      try {
        // Gọi Custom REST API trên WordPress để ghi dữ liệu đăng ký vào wp_learnpress_user_items
        const res = await fetch(`${wpUrl}/wp-json/custom/v1/enroll`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: sessionUser.id,
            course_id: course_id,
          }),
          cache: "no-store",
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error("WordPress LearnPress Enroll API response:", errText);
        }
      } catch (err) {
        console.error("Lỗi gọi enroll LearnPress API:", err);
      }
    }

    return NextResponse.json({ success: true, isEnrolled: true });
  } catch (error) {
    console.error("Lỗi đăng ký khóa học:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi khi đăng ký khóa học." }, { status: 500 });
  }
}
