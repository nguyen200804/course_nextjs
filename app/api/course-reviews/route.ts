import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course_id") || searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ success: false, message: "Thiếu course_id" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("session_user");
    const sessionUser = userCookie ? JSON.parse(userCookie.value) : null;
    const userId = searchParams.get("user_id") || sessionUser?.id || 0;

    const wpUrl = process.env.WORDPRESS_URL || "https://test4.questx.com.vn";

    const res = await fetch(`${wpUrl}/wp-json/custom/v1/course-reviews?course_id=${courseId}&user_id=${userId}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        reviews: [],
        rating_details: { average: 0.0, total: 0, stars: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }, percents: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 } },
        can_review: false,
        user_reviewed: false,
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Lỗi API GET /api/course-reviews:", error);
    return NextResponse.json({ success: false, reviews: [], message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const courseId = body.course_id || body.courseId;
    const title = body.title || "";
    const content = body.content || "";
    const rating = body.rating || 5;

    if (!courseId || !content) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập đầy đủ nội dung đánh giá." }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("session_user");
    const sessionUser = userCookie ? JSON.parse(userCookie.value) : null;
    const userId = body.user_id || sessionUser?.id;

    if (!userId) {
      return NextResponse.json({ success: false, message: "Bạn cần đăng nhập để đánh giá khóa học." }, { status: 401 });
    }

    const wpUrl = process.env.WORDPRESS_URL || "https://test4.questx.com.vn";

    const res = await fetch(`${wpUrl}/wp-json/custom/v1/course-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: courseId,
        user_id: userId,
        title,
        content,
        rating,
      }),
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ success: false, message: data.message || "Không thể gửi đánh giá." }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Lỗi API POST /api/course-reviews:", error);
    return NextResponse.json({ success: false, message: error.message || "Lỗi máy chủ khi gửi đánh giá." }, { status: 500 });
  }
}
