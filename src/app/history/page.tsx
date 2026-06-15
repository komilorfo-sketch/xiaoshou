'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Clock, 
  FileText, 
  ChevronRight, 
  Copy, 
  Check, 
  Target, 
  Trophy, 
  MessageSquare, 
  Zap, 
  Share2, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [userName, setUserName] = useState('销售专家');
  const [isAdmin, setIsAdmin] = useState(false);
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
    fetchSessions(user.id);
  }, [router]);

  const fetchSessions = async (userId: string) => {
    try {
      // Add type=completed to ensure we only show finished prep tasks in the History Library
      const res = await fetch(`/api/history?userId=${userId}&type=completed`);
      const data = await res.json();
      setSessions(data);
      if (data.length > 0) {
        setSelectedSession(data[0]);
      }
    } catch (error) {
      console.error('Fetch sessions error:', error);
      toast.error('载入失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    toast.success('已复制');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const filteredSessions = sessions.filter(s => 
    s.isCompleted && // HARD FILTER: Only show completed tasks in history library
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="flex h-screen w-full overflow-hidden bg-slate-50 flex-col font-sans antialiased text-slate-900">
      <MainHeader userName={userName} activePage="history" isAdmin={isAdmin} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Session List */}
        <div className="w-[30%] h-full bg-white border-r border-slate-100 flex flex-col shadow-sm relative z-20">
          <div className="p-6 border-b border-slate-50 bg-slate-50/30">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4" />
              历史备战库
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

                      <span
                        onClick={async (e) => {
                          e.stopPropagation();
                          const newShared = !session.isShared;
                          await fetch(`/api/sessions/${session.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isShared: newShared }),
                          });
                          setSessions(prev => prev.map(s => s.id === session.id ? { ...s, isShared: newShared } : s));
                          if (selectedSession?.id === session.id) {
                            setSelectedSession((prev: any) => ({ ...prev, isShared: newShared }));
                          }
                          toast.success(newShared ? '已分享到共享库' : '已取消分享');
                        }}
                        className={`text-xs font-bold tracking-wide cursor-pointer hover:underline flex items-center gap-1 ${
                          session.isShared ? 'text-primary' : 'text-slate-900 hover:text-primary'
                        }`}
                      >
                        <Share2 className="w-3 h-3" />
                        {session.isShared ? '已分享' : '分享'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        onClick={(e) => {
                          if (!session.isReviewed) {
                            e.stopPropagation();
                            router.push(`/review/${session.id}`);
                          }
                        }}
                        className={`text-xs font-black tracking-wide cursor-pointer hover:underline ${
                          session.isReviewed
                            ? 'text-emerald-600'
                            : 'text-red-500'
                        }`}>
                        {session.isReviewed ? '已复盘' : '待复盘'}
                      </span>
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
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-auto shrink-0">
                    {!selectedSession.isReviewed && (
                      <Button 
                        size="sm" 
                        className="rounded-xl font-bold text-sm h-10 px-8 bg-[#0066ff] hover:bg-blue-700 text-white shadow-lg shadow-blue-100 gap-2"
                        onClick={() => router.push(`/review/${selectedSession.id}`)}
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        开始复盘
                      </Button>
                    )}
                  </div>
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

                  <div className="h-[calc(100vh-280px)] mt-6">
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
                            <p className="text-sm text-slate-900 mt-2">请点击右上角“开始复盘”按钮，完成战后对账。</p>
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
                <FileText className="w-10 h-10 text-slate-100" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-widest mb-3">推演资产库加载中</h3>
              <p className="text-base font-medium text-slate-900 max-w-[380px] leading-relaxed">请从左侧列表选择一次历史回溯。高分战例将沉淀为企业核心销售知识镜像。</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
