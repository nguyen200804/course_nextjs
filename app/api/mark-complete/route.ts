import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { markLearnDashComplete } from "@/lib/wordpress";

export async function POST(req: Request) {
  try {
    const { courseId, lessonId } = await req.json();

    if (!courseId || !lessonId) {
      return NextResponse.json({ success: false, message: "Thiếu courseId hoặc lessonId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("session_user");
    const user = userCookie ? JSON.parse(userCookie.value) : null;

    if (!user || !user.id) {
      return NextResponse.json({ success: false, message: "Bạn cần đăng nhập để thực hiện" }, { status: 401 });
    }

    const result = await markLearnDashComplete(user.id.toString(), courseId.toString(), lessonId.toString());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Lỗi API /api/mark-complete:", error);
    return NextResponse.json({ success: false, message: error.message || "Lỗi máy chủ" }, { status: 500 });
  }
}
