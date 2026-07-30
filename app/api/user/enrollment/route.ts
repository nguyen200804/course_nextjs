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

// POST: Đăng ký (Enroll) vào khóa học miễn phí (Start Now)
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

    const wpUrl = process.env.WORDPRESS_URL;
    const username = process.env.WORDPRESS_API_USERNAME;
    const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    if (wpUrl && username && password && sessionUser?.id) {
      const credentials = Buffer.from(`${username}:${password}`).toString("base64");
      // Gọi REST API LearnDash enroll user: POST /ldlms/v1/users/<id>/courses
      try {
        await fetch(`${wpUrl}/wp-json/ldlms/v1/users/${sessionUser.id}/courses`, {
          method: "POST",
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ course_ids: [course_id] }),
          cache: "no-store",
        });
      } catch (err) {
        console.error("Lỗi gọi enroll LearnDash API:", err);
      }
    }

    return NextResponse.json({ success: true, isEnrolled: true });
  } catch (error) {
    console.error("Lỗi đăng ký khóa học miễn phí:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi khi đăng ký khóa học." }, { status: 500 });
  }
}
