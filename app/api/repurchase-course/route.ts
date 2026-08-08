import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { repurchaseLearnPressCourse } from "@/lib/wordpress";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const courseId = body.courseId || body.course_id;
    const action = body.action || "reset";

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

    const result = await repurchaseLearnPressCourse(userId.toString(), courseId.toString(), action);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Lỗi API /api/repurchase-course:", error);
    return NextResponse.json({ success: false, message: error.message || "Lỗi máy chủ" }, { status: 500 });
  }
}
