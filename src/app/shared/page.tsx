'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Clock,
  FileText,
  Target,
  Trophy,
  MessageSquare,
  Zap,
  AlertCircle,
  Users,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MainHeader } from '@/components/MainHeader';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function cleanReport(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/\[THOUGHTS:\s*[\s\S]*?\]/g, '')
    .replace(/\[THOUGHTS\]/g, '')
    .replace(/\[ITEM_CONFIRMED:\s*\d+\]/g, '')
    .replace(/\[ITEM_QUALITY:[^\]]*\]/g, '')
    .replace(/\[ITEM_PROGRESS:[^\]]*\]/g, '')
    .replace(/\[SESSION_TITLE:[^\]]*\]/g, '')
    .replace(/\[SESSION_COMPLETE\]/g, '')
    .trim();
}

export default function SharedPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('销售专家');
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(savedUser);
    setUserName(user.name);
    setIsAdmin(user.isAdmin || false);
    setCurrentUserId(user.id);
    fetchSessions();
  }, [router]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/history?type=shared');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSessions(list);
      if (list.length > 0) {
        setSelectedSession(list[0]);
      }
    } catch (error) {
      console.error('Fetch shared sessions error:', error);
      toast.error('载入失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnshare = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShared: false }),
      });
      if (!res.ok) throw new Error();
      toast.success('已取消分享');
      setSelectedSession(null);
      fetchSessions();
    } catch {
      toast.error('取消分享失败');
    }
  };

  const filteredSessions = sessions.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex h-screen w-full overflow-hidden bg-slate-50 flex-col font-sans antialiased text-slate-900">
      <MainHeader userName={userName} activePage="shared" isAdmin={isAdmin} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Shared Session List */}
        <div className="w-[30%] h-full bg-white border-r border-slate-100 flex flex-col shadow-sm relative z-20">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Users className="w-4 h-4" />
              共享备战库
            </h2>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-900 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="搜索任务或客户名称..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100/50 border-none text-sm placeholder:text-slate-900 focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`group p-5 rounded-2xl cursor-pointer transition-all border ${
                    selectedSession?.id === session.id
                    ? 'bg-primary/5 border-primary/20 shadow-sm ring-1 ring-primary/5'
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-base font-bold tracking-tight line-clamp-1 ${
                      selectedSession?.id === session.id ? 'text-primary' : 'text-slate-700'
                    }`}>
                      {session.title || '未命名备战'}
                    </h3>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-900">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(session.updatedAt).toLocaleDateString()}</span>
                      </div>

                      {session.isReviewed && (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Trophy className="w-3 h-3" />
                          <span>{Math.round(((session.accuracyScore || 0) + (session.adherenceScore || 0)) / 2)}分</span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-xs font-medium text-primary">
                        <Users className="w-3 h-3" />
                        <span>{session.user?.name || '未知'}</span>
                      </div>

                      {session.userId === currentUserId && (
                        <button
                          onClick={(e) => handleUnshare(session.id, e)}
                          className="flex items-center gap-1 text-xs font-medium text-slate-900 hover:text-red-500 transition-colors ml-auto"
                          title="取消分享"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>取消分享</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Content Area */}
        <div className="w-[70%] h-full bg-slate-50 overflow-hidden flex flex-col">
          {selectedSession ? (
            <>
              {/* Context Header */}
              <div className="bg-white border-b border-slate-100 px-10 py-8 flex flex-col gap-6 shrink-0 shadow-sm relative z-10 w-full">
                <div className="flex items-center w-full">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-sm">
                      <Target className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none group flex items-center gap-2">
                        {selectedSession.title}
                      </h1>
                      <p className="text-sm text-slate-900 mt-1">分享人：{selectedSession.user?.name || '未知'}</p>
                    </div>
                  </div>
                  {selectedSession.userId === currentUserId && (
                    <button
                      onClick={() => handleUnshare(selectedSession.id, { stopPropagation: () => {} } as React.MouseEvent)}
                      className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-900 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <X className="w-4 h-4" />
                      取消分享
                    </button>
                  )}
                </div>

                <Tabs defaultValue="plan" className="w-full">
                  <TabsList className="bg-slate-100 p-1 h-12 gap-1 rounded-xl w-fit">
                    <TabsTrigger value="plan" className="rounded-lg px-8 font-bold text-base h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-900 data-[state=active]:text-primary">
                      <FileText className="w-4 h-4 mr-2" />
                      销售备战报告
                    </TabsTrigger>
                    <TabsTrigger value="speech" className="rounded-lg px-8 font-bold text-base h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-900 data-[state=active]:text-primary">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      交流建议话术
                    </TabsTrigger>
                    <TabsTrigger value="review" className="rounded-lg px-8 font-bold text-base h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-900 data-[state=active]:text-primary">
                      <Zap className="w-4 h-4 mr-2" />
                      事后总结复盘
                    </TabsTrigger>
                  </TabsList>

                  <div className="h-[calc(100vh-300px)] mt-6">
                    <ScrollArea className="h-full pr-4">
                      <TabsContent value="plan" className="m-0 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-slate-100">
                          <div className="prose prose-slate prose-lg max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {cleanReport(selectedSession.fullReport) || "暂无备战报告。"}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="speech" className="m-0 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[2rem] p-12 shadow-sm border border-slate-100">
                          <div className="prose prose-slate prose-lg max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {cleanReport(selectedSession.actionGuide) || "暂无交流建议。"}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="review" className="m-0 animate-in fade-in duration-300 space-y-8">
                        {selectedSession.isReviewed ? (
                          <>
                            <section className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
                              <div className="bg-slate-50/50 px-10 py-4 flex items-center justify-between border-b border-slate-100">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-primary" />
                                  战后对账与诊断书
                                </h3>
                                <div className="flex gap-4">
                                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[10px]">准度: {selectedSession.accuracyScore}%</Badge>
                                  <Badge className="bg-blue-50 text-blue-600 border-none font-bold text-[10px]">执行: {selectedSession.adherenceScore}%</Badge>
                                </div>
                              </div>
                              <div className="p-12 prose prose-slate max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {selectedSession.diagnosticLetter || "正在分析复盘结果..."}
                                </ReactMarkdown>
                              </div>
                            </section>

                            <section className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
                              <div className="bg-slate-50/50 px-10 py-4 border-b border-slate-100">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                  <Zap className="w-4 h-4 text-amber-500" />
                                  立即行动与补救指令
                                </h3>
                              </div>
                              <div className="p-12 prose prose-slate max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {selectedSession.nextStepInstructions || "暂无下一步指令。"}
                                </ReactMarkdown>
                              </div>
                            </section>
                          </>
                        ) : (
                          <div className="bg-white rounded-[2rem] p-20 shadow-sm border border-slate-100 text-center">
                            <Zap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900">尚未执行复盘</h3>
                            <p className="text-sm text-slate-900 mt-2">该备战尚未进行战后复盘。</p>
                          </div>
                        )}
                      </TabsContent>
                    </ScrollArea>
                  </div>
                </Tabs>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
              <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center mb-8 border border-slate-50">
                <Users className="w-10 h-10 text-slate-100" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-widest mb-3">共享备战库</h3>
              <p className="text-[11px] font-medium text-slate-900 max-w-[280px] leading-relaxed">暂无共享备战。其他用户分享备战后，将在此展示。</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
