import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
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
        quizzes: [],
        counts: { total: 0, passed: 0, failed: 0, inprogress: 0 },
      });
    }

    const wpUrl = process.env.WORDPRESS_URL;
    const apiUsername = process.env.WORDPRESS_API_USERNAME;
    const apiPassword = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    if (!wpUrl) {
      return NextResponse.json({
        quizzes: [],
        counts: { total: 0, passed: 0, failed: 0, inprogress: 0 },
      });
    }

    const authHeaders: Record<string, string> = {};
    if (apiUsername && apiPassword) {
      authHeaders["Authorization"] = `Basic ${Buffer.from(
        `${apiUsername}:${apiPassword}`
      ).toString("base64")}`;
    }

    // ─── Step 1: Fetch user profile từ LearnPress REST API ───
    // Endpoint thực: /learnpress/v1/users/{id}
    // Data quiz nằm trong tabs.quizzes.content (object gồm: all, passed, failed, in-progress, finished)
    const userRes = await fetch(
      `${wpUrl}/wp-json/learnpress/v1/users/${sessionUser.id}`,
      { headers: authHeaders, cache: "no-store" }
    );

    if (!userRes.ok) {
      console.error("Lỗi lấy LearnPress user data:", userRes.status);
      return NextResponse.json({
        quizzes: [],
        counts: { total: 0, passed: 0, failed: 0, inprogress: 0 },
      });
    }

    const userData = await userRes.json();
    const quizzesContent = userData?.tabs?.quizzes?.content;

    if (!quizzesContent) {
      return NextResponse.json({
        quizzes: [],
        counts: { total: 0, passed: 0, failed: 0, inprogress: 0 },
      });
    }

    // ─── Step 2: Lấy danh sách quiz từ tab "all" (tất cả lần làm) ───
    // Mỗi entry có dạng: { id (quiz_id), result, graduation, start_time, end_time, data: { ... } }
    const allAttempts: any[] = Array.isArray(quizzesContent.all)
      ? quizzesContent.all
      : [];

    const counts = { total: 0, passed: 0, failed: 0, inprogress: 0 };

    // ─── Step 3: Fetch title của từng quiz bằng wp/v2/lp_quiz/{id} ───
    const quizIdSet = [...new Set(allAttempts.map((a: any) => a.id))];

    const quizMeta: Record<string, { title: string; slug: string; courseId?: number; courseTitle?: string; courseSlug?: string }> = {};

    await Promise.all(
      quizIdSet.map(async (qid) => {
        try {
          const qRes = await fetch(
            `${wpUrl}/wp-json/wp/v2/lp_quiz/${qid}?_fields=id,title,slug,parent`,
            { headers: authHeaders, cache: "no-store" }
          );
          if (qRes.ok) {
            const qData = await qRes.json();
            quizMeta[String(qid)] = {
              title: qData.title?.rendered || `Quiz #${qid}`,
              slug: qData.slug || `quiz-${qid}`,
            };
          }
        } catch { /* best-effort */ }
      })
    );

    // ─── Step 4: Normalize data ───
    const formattedQuizzes = allAttempts.map((attempt: any, idx: number) => {
      const quizId = attempt.id;
      const meta = quizMeta[String(quizId)];

      const graduation = (attempt.graduation || "").toLowerCase();
      let status: "passed" | "failed" | "in-progress" | "completed" = "in-progress";
      if (graduation === "passed" || graduation === "graduate") {
        status = "passed";
        counts.passed++;
      } else if (graduation === "failed") {
        status = "failed";
        counts.failed++;
      } else if (graduation === "completed" || graduation === "finished") {
        status = "completed";
      } else {
        status = "in-progress";
        counts.inprogress++;
      }
      counts.total++;

      // Điểm số từ data object
      const data = attempt.data || {};
      const userMark = data.user_mark ?? null;
      const totalMark = data.mark ?? null;
      const resultPercent = data.result ?? null; // 0-100
      const resultStr = attempt.result || ""; // e.g. "100%"

      // Thời gian làm
      const timeSpend = data.time_spend || null; // e.g. "00:00:27"

      // Số câu hỏi
      const questionCount = data.question_count ?? null;
      const questionCorrect = data.question_correct ?? null;

      return {
        id: `${quizId}-${idx}`,
        quizId,
        title: meta?.title || `Quiz #${quizId}`,
        slug: meta?.slug || `quiz-${quizId}`,
        courseTitle: attempt.course_title || null,
        courseSlug: attempt.course_slug || null,
        courseId: attempt.course_id || null,
        status,
        // Score
        score: userMark !== null ? Number(userMark) : null,
        totalScore: totalMark !== null ? Number(totalMark) : null,
        scorePercent: resultPercent !== null ? Number(resultPercent) : null,
        resultLabel: resultStr,
        // Questions summary
        questionCount,
        questionCorrect,
        // Timing
        duration: timeSpend,
        startedAt: attempt.start_time || null,
        completedAt: attempt.end_time || null,
        // Attempts
        attempts: 1, // mỗi entry là 1 lần làm
        // Passing grade
        passingGrade: data.passing_grade || null,
        // Detailed questions map
        questionsData: data.questions || attempt.questions || null,
        // Previous retake attempts list
        attempt: attempt.attempt || [],
      };
    });

    return NextResponse.json({ quizzes: formattedQuizzes, counts });
  } catch (error) {
    console.error("Lỗi API user/quizzes:", error);
    return NextResponse.json(
      { error: "Lỗi hệ thống khi tải danh sách quiz." },
      { status: 500 }
    );
  }
}
