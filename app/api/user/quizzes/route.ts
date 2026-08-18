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

    // ─── Step 2: Lấy danh sách quiz từ tab "all" và chỉ giữ lại kết quả mới nhất cho mỗi Quiz ───
    const allAttempts: any[] = Array.isArray(quizzesContent.all)
      ? quizzesContent.all
      : [];

    // Nhóm theo Quiz ID và chỉ giữ lại lượt làm mới nhất cho mỗi Quiz
    const latestAttemptsByQuizId = new Map<string, any>();
    const attemptCountByQuizId: Record<string, number> = {};

    allAttempts.forEach((attempt: any) => {
      const qid = attempt.id;
      if (!qid) return;

      const qidKey = String(qid);
      attemptCountByQuizId[qidKey] = (attemptCountByQuizId[qidKey] || 0) + 1;

      const existing = latestAttemptsByQuizId.get(qidKey);
      if (!existing) {
        latestAttemptsByQuizId.set(qidKey, attempt);
      } else {
        // So sánh thời gian làm bài (end_time, start_time) hoặc ID để lấy lần làm mới nhất
        const timeExisting = new Date(existing.end_time || existing.start_time || 0).getTime();
        const timeCurrent  = new Date(attempt.end_time || attempt.start_time || 0).getTime();

        if (timeCurrent >= timeExisting) {
          latestAttemptsByQuizId.set(qidKey, attempt);
        }
      }
    });

    const uniqueLatestAttempts = Array.from(latestAttemptsByQuizId.values());
    const counts = { total: 0, passed: 0, failed: 0, inprogress: 0 };

    const quizIdSet = [...new Set(uniqueLatestAttempts.map((a: any) => a.id))];
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
            let parentCourseSlug = "";
            let parentCourseTitle = "";

            if (qData.parent) {
              try {
                const cRes = await fetch(
                  `${wpUrl}/wp-json/wp/v2/lp_course/${qData.parent}?_fields=id,title,slug`,
                  { headers: authHeaders, cache: "no-store" }
                );
                if (cRes.ok) {
                  const cData = await cRes.json();
                  if (cData) {
                    parentCourseSlug = cData.slug || "";
                    parentCourseTitle = cData.title?.rendered || "";
                  }
                }
              } catch {}
            }

            quizMeta[String(qid)] = {
              title: qData.title?.rendered || `Quiz #${qid}`,
              slug: qData.slug || `quiz-${qid}`,
              courseId: qData.parent || undefined,
              courseSlug: parentCourseSlug || undefined,
              courseTitle: parentCourseTitle || undefined,
            };
          }
        } catch { /* best-effort */ }
      })
    );

    // ─── Step 4: Normalize data (kết quả mới nhất của mỗi quiz) ───
    const formattedQuizzes = uniqueLatestAttempts.map((attempt: any, idx: number) => {
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
      let timeSpend = attempt.time_spend || attempt.time_spent || attempt.results?.time_spend || attempt.results?.time_spent || data.time_spend || data.time_spent || null;

      // Chuẩn hóa nếu timeSpend là số giây (number hoặc chuỗi số)
      if (timeSpend !== null) {
        let totalSecs = -1;
        if (typeof timeSpend === "number") {
          totalSecs = timeSpend;
        } else if (typeof timeSpend === "string" && /^\d+$/.test(timeSpend)) {
          totalSecs = parseInt(timeSpend, 10);
        }
        
        if (totalSecs >= 0) {
          const hrs = Math.floor(totalSecs / 3600);
          const mins = Math.floor((totalSecs % 3600) / 60);
          const secs = totalSecs % 60;
          timeSpend = [
            hrs.toString().padStart(2, '0'),
            mins.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
          ].join(':');
        }
      }

      // Fallback: Tính toán từ start_time và end_time nếu không có hoặc không khớp
      if ((!timeSpend || timeSpend === "00:00:00") && attempt.start_time && attempt.end_time) {
        try {
          const start = new Date(attempt.start_time).getTime();
          const end = new Date(attempt.end_time).getTime();
          if (!isNaN(start) && !isNaN(end)) {
            const diffSeconds = Math.round((end - start) / 1000);
            if (diffSeconds >= 0) {
              const hrs = Math.floor(diffSeconds / 3600);
              const mins = Math.floor((diffSeconds % 3600) / 60);
              const secs = diffSeconds % 60;
              timeSpend = [
                hrs.toString().padStart(2, '0'),
                mins.toString().padStart(2, '0'),
                secs.toString().padStart(2, '0')
              ].join(':');
            }
          }
        } catch {}
      }

      // Số câu hỏi
      const questionCount = data.question_count ?? null;
      const questionCorrect = data.question_correct ?? null;

      return {
        id: `${quizId}`,
        quizId,
        title: meta?.title || `Quiz #${quizId}`,
        slug: meta?.slug || `quiz-${quizId}`,
        courseTitle: attempt.course_title || meta?.courseTitle || null,
        courseSlug: attempt.course_slug || meta?.courseSlug || null,
        courseId: attempt.course_id || meta?.courseId || null,
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
        // Tổng số lần làm bài của quiz này
        attempts: attemptCountByQuizId[String(quizId)] || 1,
        // Passing grade
        passingGrade: data.passing_grade || null,
        // Detailed questions map
        questionsData: data.questions || attempt.questions || null,
        // Previous retake attempts list
        attempt: attempt.attempt || [],
      };
    });

    // Sắp xếp quiz mới hoàn thành / làm gần nhất lên đầu
    formattedQuizzes.sort((a, b) => {
      const timeA = new Date(a.completedAt || a.startedAt || 0).getTime();
      const timeB = new Date(b.completedAt || b.startedAt || 0).getTime();
      return timeB - timeA;
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
