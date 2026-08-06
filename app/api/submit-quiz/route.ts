import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const wpUrl = process.env.WORDPRESS_URL || process.env.NEXT_PUBLIC_WORDPRESS_URL || "https://test4.questx.com.vn";

    // Lấy user_id từ cookie session nếu không có trong body
    if (!body.user_id) {
      const cookieStore = await cookies();
      const userCookie = cookieStore.get("session_user");
      if (userCookie) {
        const user = JSON.parse(userCookie.value);
        body.user_id = user?.id;
      }
    }

    if (!body.user_id || !body.quiz_id) {
      return NextResponse.json(
        { success: false, message: "Thiếu user_id hoặc quiz_id" },
        { status: 400 }
      );
    }

    const res = await fetch(`${wpUrl}/wp-json/custom/v1/submit-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : 500 });
  } catch (error: any) {
    console.error("Lỗi API /api/submit-quiz:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}
