import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getLearnDashCourses } from "@/lib/wordpress";

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

    // Nếu chưa đăng nhập, trả về mảng rỗng và counts = 0
    if (!sessionUser?.id) {
      return NextResponse.json({
        courses: [],
        counts: { enrolled: 0, inprogress: 0, finished: 0, passed: 0, failed: 0 },
      });
    }

    const wpUrl = process.env.WORDPRESS_URL;
    const username = process.env.WORDPRESS_API_USERNAME;
    const password = process.env.WORDPRESS_API_APPLICATION_PASSWORD;

    if (!wpUrl) {
      return NextResponse.json({
        courses: [],
        counts: { enrolled: 0, inprogress: 0, finished: 0, passed: 0, failed: 0 },
      });
    }

    const headers: Record<string, string> = {};
    if (username && password) {
      headers["Authorization"] = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
    }

    let rawCourses: any[] = [];
    let customCounts: { enrolled?: number; inprogress?: number; finished?: number; passed?: number; failed?: number } | null = null;

    // 1. Thử gọi Custom REST API endpoint `/custom/v1/user-courses?user_id={id}`
    try {
      const customRes = await fetch(`${wpUrl}/wp-json/custom/v1/user-courses?user_id=${sessionUser.id}`, {
        headers,
        cache: "no-store",
      });
      if (customRes.ok) {
        const data = await customRes.json();
        if (data && Array.isArray(data.courses)) {
          rawCourses = data.courses;
          if (data.counts) {
            customCounts = data.counts;
          }
        } else if (Array.isArray(data)) {
          rawCourses = data;
        }
      }
    } catch {
      // Fallback
    }

    // 2. Thử gọi LearnPress REST API `/learnpress/v1/users/{id}` (hoặc `/courses`)
    if (rawCourses.length === 0) {
      try {
        const lpUserRes = await fetch(`${wpUrl}/wp-json/learnpress/v1/users/${sessionUser.id}`, {
          headers,
          cache: "no-store",
        });
        if (lpUserRes.ok) {
          const userData = await lpUserRes.json();
          const coursesTab = userData?.tabs?.courses?.content;
          if (coursesTab) {
            const allTabCourses = Array.isArray(coursesTab.all)
              ? coursesTab.all
              : (Array.isArray(coursesTab.enrolled) ? coursesTab.enrolled : (Array.isArray(coursesTab) ? coursesTab : []));
            if (allTabCourses.length > 0) {
              rawCourses = allTabCourses;
            }
          }
        }
      } catch (err) {
        console.warn("Lỗi fetch LearnPress user profile courses:", err);
      }
    }

    if (rawCourses.length === 0) {
      try {
        const lpRes = await fetch(`${wpUrl}/wp-json/learnpress/v1/users/${sessionUser.id}/courses`, {
          headers,
          cache: "no-store",
        });
        if (lpRes.ok) {
          const data = await lpRes.json();
          if (Array.isArray(data)) {
            rawCourses = data;
          }
        }
      } catch (err) {
        console.warn("Lỗi fetch LearnPress user courses:", err);
      }
    }

    // 3. Thử gọi LearnDash REST API `/ldlms/v1/users/{id}/courses`
    if (rawCourses.length === 0) {
      try {
        const userCoursesRes = await fetch(`${wpUrl}/wp-json/ldlms/v1/users/${sessionUser.id}/courses`, {
          headers,
          cache: "no-store",
        });
        if (userCoursesRes.ok) {
          const userCourses = await userCoursesRes.json();
          if (Array.isArray(userCourses)) {
            const allCourses = await getLearnDashCourses().catch(() => []);
            rawCourses = userCourses.map((uc: any) => {
              const courseId = typeof uc === "object" ? uc.id : uc;
              const courseDetail = Array.isArray(allCourses)
                ? allCourses.find((c: any) => String(c.id) === String(courseId))
                : null;
              return {
                id: courseId,
                title: courseDetail?.title?.rendered || `Khóa học #${courseId}`,
                slug: courseDetail?.slug || `course-${courseId}`,
                description: courseDetail?.excerpt?.rendered?.replace(/<[^>]+>/g, '') || "",
                image: courseDetail?.featured_media_src_url || "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop",
                progress: 0,
                status: 'in-progress',
              };
            });
          }
        }
      } catch (err) {
        console.warn("Lỗi fetch LearnDash user courses:", err);
      }
    }

    // Định dạng danh sách khóa học và tính toán 5 chỉ số counts
    const counts = { enrolled: 0, inprogress: 0, finished: 0, passed: 0, failed: 0 };

    const formattedCourses = rawCourses.map((c: any) => {
      let status: 'enrolled' | 'in-progress' | 'finished' | 'passed' | 'failed' = 'enrolled';
      const rawStatus = (c.status || c.results?.status || '').toLowerCase();
      const graduation = (c.graduation || '').toLowerCase();
      const resultGrade = (c.grade || c.results?.grade || '').toLowerCase();
      const progressNum = Math.min(100, Math.max(0, Number(c.progress ?? c.results?.result ?? 0)));

      if (c.status === 'passed' || resultGrade === 'passed' || rawStatus === 'passed' || graduation === 'passed') {
        status = 'passed';
      } else if (c.status === 'failed' || resultGrade === 'failed' || rawStatus === 'failed' || graduation === 'failed') {
        status = 'failed';
      } else if (c.status === 'finished' || rawStatus === 'completed' || rawStatus === 'finished' || graduation === 'completed' || progressNum === 100) {
        status = 'finished';
      } else if (c.status === 'in-progress' || rawStatus === 'in-progress' || graduation === 'in-progress' || progressNum > 0) {
        status = 'in-progress';
      } else {
        status = 'enrolled';
      }

      // Tăng chỉ số tương ứng
      counts.enrolled += 1;
      if (status === 'in-progress' || status === 'enrolled') counts.inprogress += 1;
      if (status === 'passed') counts.passed += 1;
      if (status === 'failed') counts.failed += 1;

      const courseTitle = c.title?.rendered || c.name || c.title || `Khóa học #${c.id}`;
      const courseSlug = c.slug || `course-${c.id}`;
      const courseDesc = c.excerpt?.rendered?.replace(/<[^>]+>/g, '') || c.description || "";
      const courseImg = c.featured_media_src_url || c.image || "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=600&auto=format&fit=crop";
      const passingGradeVal = c.passingGradeProgress || (c.passingGrade ? `${c.passingGrade}%` : '80%');

      return {
        id: c.id || c.course_id,
        title: courseTitle,
        slug: courseSlug,
        description: courseDesc,
        image: courseImg,
        progress: progressNum,
        courseProgress: c.courseProgress || `${progressNum}%`,
        passingGradeProgress: passingGradeVal,
        passingGrade: c.passingGrade || 80,
        status: status,
        result: c.result || `${progressNum}%`,
        expirationTime: c.expirationTime || c.expiration_time || c.expiry_date || "-",
        endTime: c.endTime || c.end_time || c.completed_date || "-",
      };
    });

    // Finished Course là tổng cộng giữa Passed Course và Failed Course
    counts.finished = counts.passed + counts.failed;

    // Nếu customCounts đã có đầy đủ từ WordPress, ưu tiên tính nhất quán
    const finalCounts = customCounts ? {
      enrolled: Number(customCounts.enrolled ?? counts.enrolled),
      inprogress: Number(customCounts.inprogress ?? counts.inprogress),
      passed: Number(customCounts.passed ?? counts.passed),
      failed: Number(customCounts.failed ?? counts.failed),
      finished: Number((customCounts.passed ?? counts.passed) + (customCounts.failed ?? counts.failed)),
    } : counts;

    return NextResponse.json({
      courses: formattedCourses,
      counts: finalCounts,
    });
  } catch (error) {
    console.error("Lỗi API my-courses:", error);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải danh sách khóa học." }, { status: 500 });
  }
}

