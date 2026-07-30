import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const courseId = body.courseId || body.course_id;

    if (!courseId) {
      return NextResponse.json({ success: false, message: "Thiếu courseId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("session_user");
    const user = userCookie ? JSON.parse(userCookie.value) : null;
    const userId = body.user_id || user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: "Bạn cần đăng nhập để thực hiện" }, { status: 401 });
    }

    const wpUrl = process.env.WORDPRESS_URL || "https://test4.questx.com.vn";

    const res = await fetch(`${wpUrl}/wp-json/custom/v1/finish-course`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, course_id: courseId }),
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, message: data.message || "Không thể hoàn thành khóa học" }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Lỗi API /api/finish-course:", error);
    return NextResponse.json({ success: false, message: error.message || "Lỗi máy chủ" }, { status: 500 });
  }
}
