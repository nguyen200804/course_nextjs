import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { recordVideoProgress } from "@/lib/wordpress";

export async function POST(req: Request) {
  try {
    const { lessonId } = await req.json();

    if (!lessonId) {
      return NextResponse.json({ success: false, message: "Thiếu lessonId" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("session_user");
    const user = userCookie ? JSON.parse(userCookie.value) : null;

    if (!user || !user.id) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
    }

    const result = await recordVideoProgress(user.id.toString(), lessonId.toString());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Lỗi API /api/video-progress:", error);
    return NextResponse.json({ success: false, message: error.message || "Lỗi máy chủ" }, { status: 500 });
  }
}
