import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-sans antialiased text-slate-900 border-t-4 border-slate-900">
      <div className="w-full max-w-[450px] px-4">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
            售前备战：首战即决战
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <div className="space-y-2 pb-8 pt-10 px-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />
              </svg>
              接入备战状态
            </h2>
            <p className="text-sm text-slate-400 font-medium">
              请输入您的员工编号或邮箱以接入战术网络
            </p>
          </div>

          <form action="/api/auth/login-form" method="POST">
            <div className="grid gap-6 py-2 px-8">
              <div className="grid gap-2">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-4 text-slate-400">
                    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" />
                  </svg>
                  <input
                    name="email"
                    placeholder="邮箱 / 员工编号"
                    type="text"
                    required
                    className="w-full pl-12 h-14 text-base bg-slate-50 border border-slate-200 focus:bg-white transition-all outline-none rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <div className="relative">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-4 text-slate-400">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    name="password"
                    placeholder="访问密码"
                    type="password"
                    required
                    className="w-full pl-12 h-14 text-base bg-slate-50 border border-slate-200 focus:bg-white transition-all outline-none rounded-xl focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-6 pb-10 pt-8 px-8">
              <button
                type="submit"
                className="w-full h-14 text-lg bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98]"
              >
                接入
              </button>
              <div className="text-center">
                <Link
                  href="/register"
                  className="text-sm text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-wider underline underline-offset-4"
                >
                  尚未获得权限？申请注册接口
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
