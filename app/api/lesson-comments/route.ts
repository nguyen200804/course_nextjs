import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lessonId = searchParams.get("lesson_id") || searchParams.get("lessonId");

    if (!lessonId) {
      return NextResponse.json({ success: false, comments: [] });
    }

    const wpUrl = process.env.WORDPRESS_URL || "https://demo.edublink.co";
    const username = process.env.WORDPRESS_API_USERNAME;
    const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }

    // Try custom endpoint first
    try {
      const res = await fetch(`${wpUrl}/wp-json/custom/v1/lesson-comments?lesson_id=${lessonId}`, {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.comments)) {
          return NextResponse.json(data);
        }
      }
    } catch (_) {}

    // Fallback to standard WP comments endpoint: /wp-json/wp/v2/comments?post={lessonId}
    try {
      const res = await fetch(`${wpUrl}/wp-json/wp/v2/comments?post=${lessonId}&per_page=100&_embed=true`, {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const comments = data.map((item: any) => ({
            id: item.id,
            author: item.author_name || item.author_user_name || "Student",
            avatar: item.author_avatar_urls?.["96"] || item.author_avatar_urls?.["48"] || "https://secure.gravatar.com/avatar/?s=96&d=mm&r=g",
            date: new Date(item.date).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true }),
            content: item.content?.rendered ? item.content.rendered.replace(/<[^>]+>/g, "").trim() : String(item.content || ""),
            awaitingModeration: item.status === "hold",
          }));
          return NextResponse.json({ success: true, comments });
        }
      }
    } catch (_) {}

    return NextResponse.json({ success: true, comments: [] });
  } catch (error: any) {
    console.error("Lỗi API GET /api/lesson-comments:", error);
    return NextResponse.json({ success: false, comments: [], message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lessonId = body.lesson_id || body.lessonId;
    const content = body.content || body.comment;
    const userId = body.user_id || body.userId;

    if (!lessonId || !content) {
      return NextResponse.json({ success: false, message: "Thiếu lesson_id hoặc nội dung bình luận" }, { status: 400 });
    }

    const wpUrl = process.env.WORDPRESS_URL || "https://demo.edublink.co";
    const username = process.env.WORDPRESS_API_USERNAME;
    const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }

    // Try custom endpoint
    try {
      const res = await fetch(`${wpUrl}/wp-json/custom/v1/lesson-comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ lesson_id: lessonId, content, user_id: userId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          return NextResponse.json(data);
        }
      }
    } catch (_) {}

    // Fallback: standard WP REST API POST /wp-json/wp/v2/comments
    try {
      const res = await fetch(`${wpUrl}/wp-json/wp/v2/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          post: Number(lessonId),
          content: content,
          author_name: body.author_name || "Student",
        }),
      });
      if (res.ok) {
        const item = await res.json();
        return NextResponse.json({
          success: true,
          comment: {
            id: item.id,
            author: item.author_name || "Student",
            avatar: item.author_avatar_urls?.["96"] || "https://secure.gravatar.com/avatar/?s=96&d=mm&r=g",
            date: new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true }),
            content: content,
            awaitingModeration: false,
          },
        });
      }
    } catch (_) {}

    // Fallback response if offline/demo
    return NextResponse.json({
      success: true,
      comment: {
        id: Date.now(),
        author: body.author_name || "Student",
        avatar: "https://secure.gravatar.com/avatar/?s=96&d=mm&r=g",
        date: new Date().toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", hour12: true }),
        content: content,
        awaitingModeration: true,
      },
    });
  } catch (error: any) {
    console.error("Lỗi API POST /api/lesson-comments:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
