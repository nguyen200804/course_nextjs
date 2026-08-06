import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quiz_id") || searchParams.get("quizId") || searchParams.get("slug");

    if (!quizId) {
      return NextResponse.json({ success: false, questions: [], count: 0 });
    }

    const wpUrl = process.env.WORDPRESS_URL || "https://test4.questx.com.vn";
    const username = process.env.WORDPRESS_API_USERNAME;
    const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }

    // ── 1. Thử custom endpoint trước (ưu tiên vì có correct answer) ──
    try {
      const res = await fetch(`${wpUrl}/wp-json/custom/v1/quiz-questions?quiz_id=${encodeURIComponent(quizId)}`, {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          return NextResponse.json(data);
        }
      }
    } catch (_) {}

    // ── 2. Fallback: LearnPress REST API /learnpress/v1/quiz/{id} ──
    // Endpoint này trả option value hash (b6b5d88ca7) — cần để submit đúng về WP
    try {
      let res = await fetch(`${wpUrl}/wp-json/learnpress/v1/quiz/${encodeURIComponent(quizId)}`, { headers, cache: "no-store" });

      if (!res.ok) {
        res = await fetch(`${wpUrl}/wp-json/wp/v2/lp_quiz/${encodeURIComponent(quizId)}?_embed=true`, { headers, cache: "no-store" });
      }
      if (!res.ok) {
        res = await fetch(`${wpUrl}/wp-json/wp/v2/lp_quiz?slug=${encodeURIComponent(quizId)}&_embed=true`, { headers, cache: "no-store" });
      }

      if (res.ok) {
        const data = await res.json();
        const quizObj = Array.isArray(data) ? data[0] : data;
        const qList: any[] = quizObj?.questions || quizObj?.questions_data || [];

        if (qList.length > 0) {
          const questions = qList.map((item: any, idx: number) => {
            const qTitle =
              typeof item.title === "object"
                ? item.title.rendered
                : item.title || item.post_title || item.name || `Question ${idx + 1}`;

            // Giữ nguyên option objects để có value hash (dùng khi submit)
            const rawOptions: string[] = [];
            // optionValues: map từ display index → WP option value hash
            const optionValues: Record<number, string> = {};
            const correctIndices: number[] = [];

            if (Array.isArray(item.options)) {
              item.options.forEach((opt: any, optIdx: number) => {
                const optTitle =
                  typeof opt === "object"
                    ? opt.title || opt.value || opt.label || opt.text || ""
                    : String(opt);
                rawOptions.push(optTitle);

                if (typeof opt === "object") {
                  // Lưu value hash để dùng khi submit về WP
                  if (opt.value) {
                    optionValues[optIdx] = opt.value;
                  }
                  const isTrue =
                    opt.is_true === "yes" ||
                    opt.is_true === "1" ||
                    opt.is_true === 1 ||
                    opt.is_true === true ||
                    opt.is_correct === true ||
                    opt.is_correct === "yes";
                  if (isTrue) {
                    correctIndices.push(optIdx);
                  }
                }
              });
            }

            const qType = item.type || item.question_type || "single_choice";
            const isMulti = qType === "multi_choice" || qType === "multiple_choice";
            let correctVal: any;
            if (isMulti) {
              correctVal = correctIndices;
            } else {
              correctVal =
                correctIndices.length > 0
                  ? correctIndices[0]
                  : item.correct !== undefined
                  ? item.correct
                  : 0;
            }

            return {
              id: item.id || idx + 1,
              question: `${idx + 1}. ${qTitle.replace(/^\d+[\.\s]*/, "")}`,
              options: rawOptions,
              // optionValues: { 0: "b6b5d88ca7", 1: "f26c304ccc" }
              // Frontend dùng để build answers payload khi submit
              optionValues: Object.keys(optionValues).length > 0 ? optionValues : undefined,
              type: qType,
              correct: correctVal,
            };
          });

          return NextResponse.json({ success: true, count: questions.length, questions });
        }
      }
    } catch (_) {}

    return NextResponse.json({ success: false, questions: [], count: 0 });
  } catch (error: any) {
    console.error("Lỗi API GET /api/quiz-questions:", error);
    return NextResponse.json({ success: false, questions: [], count: 0, message: error.message }, { status: 500 });
  }
}
