export default function TopicLoading() {
  return (
    <div className="min-h-screen bg-radial from-slate-900 via-slate-950 to-black text-slate-100 font-sans antialiased">
      {/* Header Skeleton */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-4 w-36 bg-slate-800 rounded animate-pulse" />
          <div className="h-6 w-28 bg-indigo-500/10 border border-indigo-500/20 rounded-full animate-pulse" />
        </div>
      </header>

      {/* Main Skeleton */}
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Cột trái: Nội dung chủ đề Skeleton */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-xl space-y-6">
              <div className="h-3 w-28 bg-slate-800 rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-slate-800 rounded-lg animate-pulse" />
              <div className="space-y-4 pt-6">
                <div className="h-4 w-full bg-slate-800/60 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-800/60 rounded animate-pulse" />
                <div className="h-48 w-full bg-slate-950/80 border border-slate-800/50 rounded-2xl animate-pulse flex items-center justify-center">
                  <span className="text-slate-600 text-xs font-mono">Loading lesson topic...</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Sidebar giáo trình Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 backdrop-blur-xl shadow-xl sticky top-24 space-y-4">
              <div className="h-5 w-40 bg-slate-800 rounded animate-pulse" />
              <div className="space-y-2 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-full bg-slate-950/40 border border-slate-900 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
