import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLearnDashUserProgress } from "@/lib/wordpress";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("course_id") || searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ completed_lessons: [], is_blocked: false }, { status: 400 });
    }

    const cookieStore = await cookies();
    const userCookie = cookieStore.get("session_user");
    const user = userCookie ? JSON.parse(userCookie.value) : null;

    let userId = searchParams.get("user_id") || user?.id;

    if (!userId) {
      return NextResponse.json({
        completed_lessons: [],
        completed_topics: [],
        passing_grade: 80,
        user_course_status: "enrolled",
        is_blocked: false,
      });
    }

    const progress = await getLearnDashUserProgress(userId.toString(), courseId.toString());
    return NextResponse.json(progress);
  } catch (error: any) {
    console.error("Lỗi API /api/course-progress:", error);
    return NextResponse.json({ completed_lessons: [], is_blocked: false }, { status: 500 });
  }
}
