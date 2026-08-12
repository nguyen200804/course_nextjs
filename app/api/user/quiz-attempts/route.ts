import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quiz_id") || searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json(
        { success: false, message: "Missing quiz_id parameter" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sessionUserCookie = cookieStore.get("session_user")?.value;

    let sessionUser: { id: number; username: string } | null = null;
    if (sessionUserCookie) {
      try {
        sessionUser = JSON.parse(sessionUserCookie);
      } catch {
        sessionUser = null;
      }
    }

    if (!sessionUser?.id) {
      return NextResponse.json({
        success: false,
        user_id: 0,
        quiz_id: Number(quizId) || 0,
        last_attempt: null,
        attempts_count: 0,
        attempts: [],
      });
    }

    const wpUrl = process.env.WORDPRESS_URL;
    const apiUsername = process.env.WORDPRESS_API_USERNAME;
    const apiPassword = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    if (!wpUrl) {
      return NextResponse.json({
        success: false,
        user_id: sessionUser.id,
        quiz_id: Number(quizId) || 0,
        last_attempt: null,
        attempts_count: 0,
        attempts: [],
      });
    }

    const authHeaders: Record<string, string> = {};
    if (apiUsername && apiPassword) {
      authHeaders["Authorization"] = `Basic ${Buffer.from(
        `${apiUsername}:${apiPassword}`
      ).toString("base64")}`;
    }

    const fetchUrl = `${wpUrl}/wp-json/custom/v1/quiz-attempts?user_id=${sessionUser.id}&quiz_id=${encodeURIComponent(
      quizId
    )}`;

    const res = await fetch(fetchUrl, {
      headers: authHeaders,
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[quiz-attempts] WP REST API returned status:", res.status);
      return NextResponse.json({
        success: false,
        user_id: sessionUser.id,
        quiz_id: Number(quizId) || 0,
        last_attempt: null,
        attempts_count: 0,
        attempts: [],
      });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[quiz-attempts] Internal Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error fetching quiz attempts" },
      { status: 500 }
    );
  }
}
