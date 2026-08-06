import { NextResponse } from "next/server";
import { getLPQuizzes, getLPQuestions, getLPQuizQuestions, checkJWTConfiguration, getJWTAuthToken } from "@/lib/wordpress";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "quizzes"; // "quizzes" | "questions" | "quiz-questions" | "check-jwt"
    const quizId = searchParams.get("quiz_id") || searchParams.get("quizId");

    // Extract Bearer JWT token if client sent Authorization header
    const authHeader = req.headers.get("authorization");
    let jwtToken: string | undefined = undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      jwtToken = authHeader.substring(7);
    }

    if (type === "check-jwt") {
      const status = await checkJWTConfiguration(jwtToken);
      return NextResponse.json(status);
    }

    if (type === "questions") {
      const questions = await getLPQuestions(jwtToken);
      return NextResponse.json({ success: true, count: questions.length, questions });
    }

    if (type === "quiz-questions" && quizId) {
      const questions = await getLPQuizQuestions(quizId, jwtToken);
      return NextResponse.json({ success: true, quiz_id: quizId, count: questions.length, questions });
    }

    // Default: fetch all LearnPress Quizzes (lp_quiz)
    const quizzes = await getLPQuizzes(jwtToken);
    return NextResponse.json({ success: true, count: quizzes.length, quizzes });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Missing username or password" }, { status: 400 });
    }

    const authResult = await getJWTAuthToken(username, password);
    if (authResult && authResult.token) {
      return NextResponse.json({ success: true, ...authResult });
    }

    return NextResponse.json({ success: false, message: "Xác thực JWT thất bại. Kiểm tra tài khoản hoặc cấu hình WP." }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

