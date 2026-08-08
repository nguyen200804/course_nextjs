import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, message: "Dữ liệu JSON không hợp lệ" },
        { status: 400 }
      );
    }

    const wpUrl =
      process.env.WORDPRESS_URL ||
      process.env.NEXT_PUBLIC_WORDPRESS_URL ||
      "https://test4.questx.com.vn";

    // Lấy user_id từ cookie session nếu không có trong body
    if (!body.user_id) {
      try {
        const cookieStore = await cookies();
        const userCookie = cookieStore.get("session_user");
        if (userCookie?.value) {
          const user = JSON.parse(userCookie.value);
          body.user_id = user?.id;
        }
      } catch (err) {
        console.warn("Không thể đọc cookie session_user:", err);
      }
    }

    if (!body.user_id || !body.quiz_id) {
      return NextResponse.json(
        { success: false, message: "Thiếu user_id hoặc quiz_id" },
        { status: 400 }
      );
    }

    const res = await fetch(`${wpUrl}/wp-json/custom/v1/retake-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const resText = await res.text();
    let data: any = {};
    try {
      const jsonStart = resText.search(/[{\[]/);
      data = jsonStart !== -1 ? JSON.parse(resText.substring(jsonStart)) : {};
    } catch (e) {
      data = { success: false, message: resText };
    }

    return NextResponse.json(data, { status: res.status || (res.ok ? 200 : 500) });
  } catch (error: any) {
    console.error("Lỗi API /api/retake-quiz:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi máy chủ nội bộ" },
      { status: 500 }
    );
  }
}
