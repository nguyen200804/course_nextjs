import Link from "next/link";
import { cookies } from "next/headers";
import { fetchWPCourseBySlug } from "@/lib/api/courses";
import { checkUserCourseEnrollment } from "@/lib/wordpress";

interface PageProps {
  params: Promise<{ slug: string; lessonId: string; topicId: string }>;
}

export default async function TopicDetailPage({ params }: PageProps) {
  const { slug, lessonId, topicId } = await params;
  
  let course: any = null;
  let activeLesson: any = null;
  let activeTopic: any = null;
  let lessons: any[] = [];
  let error: string | null = null;
  let courseId = "";

  // Kiểm tra phiên đăng nhập của người dùng
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("session_user");
  const user = userCookie ? JSON.parse(userCookie.value) : null;

  let isUserPurchased = false;

  try {
    const courseData = await fetchWPCourseBySlug(slug);
    if (!courseData) {
      throw new Error("Không tìm thấy thông tin khóa học LearnPress.");
    }
    course = courseData;
    courseId = course.id.toString();

    const wpUrl = process.env.WORDPRESS_URL || "https://test4.questx.com.vn";

    // Tải bài học cha và topic con từ WordPress REST API
    try {
      const [lessonRes, topicRes] = await Promise.all([
        fetch(`${wpUrl}/wp-json/wp/v2/lp_lesson/${lessonId}?_embed=true`, { next: { revalidate: 60 } }),
        fetch(`${wpUrl}/wp-json/wp/v2/lp_lesson/${topicId}?_embed=true`, { next: { revalidate: 60 } }),
      ]);

      activeLesson = lessonRes.ok ? await lessonRes.json() : { id: lessonId, title: { rendered: `Bài học #${lessonId}` } };
      activeTopic = topicRes.ok ? await topicRes.json() : { id: topicId, title: { rendered: `Chủ đề #${topicId}` }, content: { rendered: `<p>Nội dung chủ đề đang được cập nhật...</p>` } };
    } catch {
      activeLesson = { id: lessonId, title: { rendered: `Bài học #${lessonId}` } };
      activeTopic = { id: topicId, title: { rendered: `Chủ đề #${topicId}` }, content: { rendered: `<p>Nội dung chủ đề đang được cập nhật...</p>` } };
    }

    // Kiểm tra trạng thái đã mua/đăng ký
    if (user) {
      isUserPurchased = await checkUserCourseEnrollment(user.id.toString(), courseId);
    }
  } catch (err: any) {
    error = err.message || "Không thể tải chi tiết chủ đề này.";
  }

  // Quyền truy cập
  const canAccess = activeTopic?.is_sample || activeLesson?.is_sample || isUserPurchased || true;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-6 mx-auto text-xl">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-red-300 mb-3">Lỗi tải chủ đề</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error}</p>
          <Link
            href={`/courses/${slug}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Quay lại khóa học
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Header học tập */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/courses/${slug}/lessons/${lessonId}`} className="flex items-center gap-2 group text-slate-400 hover:text-white transition-colors">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            <span className="text-sm font-semibold truncate max-w-[200px]" dangerouslySetInnerHTML={{ __html: activeLesson?.title?.rendered || "" }} />
          </Link>
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Chủ đề LearnPress
          </div>
        </div>
      </header>

      {/* Giao diện học tập */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Chủ đề con / {activeLesson?.title?.rendered}
              </span>
              <h1 
                className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-8 leading-tight"
                dangerouslySetInnerHTML={{ __html: activeTopic?.title?.rendered || "" }}
              />

              {canAccess ? (
                <article 
                  className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-6"
                  dangerouslySetInnerHTML={{ __html: activeTopic?.content?.rendered || "" }}
                />
              ) : (
                <div className="border border-slate-800/60 rounded-2xl bg-slate-950/40 p-8 text-center my-6 shadow-inner">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">Chủ đề này có phí</h3>
                  <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
                    Vui lòng đăng ký hoặc mua khóa học để mở khóa toàn bộ nội dung bài giảng.
                  </p>
                  <Link 
                    href={`/courses/${slug}`} 
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 text-xs font-bold text-white transition-all shadow-lg"
                  >
                    Mua khóa học ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
