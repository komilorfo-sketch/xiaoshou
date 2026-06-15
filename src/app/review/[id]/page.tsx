'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, MessageSquare, Zap, Target, Trophy, Clock, AlertCircle, History as HistoryIcon } from 'lucide-react';
import { ReviewRadarBoard } from '@/components/ReviewRadarBoard';
import { ReviewChatInterface } from '@/components/ReviewChatInterface';
import { ReviewSummary } from '@/components/ReviewSummary';
import { MainHeader } from '@/components/MainHeader';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

function extractFromChatHistory(chatHistoryJson: string | undefined | null): { reportA: string; reportB: string } {
  if (!chatHistoryJson) return { reportA: '', reportB: '' };
  try {
    const messages = JSON.parse(chatHistoryJson);
    if (!Array.isArray(messages) || messages.length === 0) return { reportA: '', reportB: '' };
    let lastContent = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === 'assistant') {
        lastContent = messages[i].content || '';
        break;
      }
    }
    if (!lastContent) return { reportA: '', reportB: '' };
    const aHeading = /(?:\*\*|###)?\s*交付物\s*A\s*[：:]\s*《?.*?全景备战报告》?/i;
    const bHeading = /(?:\*\*|###)?\s*交付物\s*B\s*[：:]\s*《?.*?现场交流建议及场景话术》?/i;
    const aMatch = lastContent.match(aHeading);
    const bMatch = lastContent.match(bHeading);
    let reportA = '';
    let reportB = '';
    if (aMatch && aMatch.index !== undefined) {
      const aStart = lastContent.indexOf('\n', aMatch.index) + 1;
      const aEnd = bMatch && bMatch.index !== undefined ? bMatch.index : lastContent.length;
      reportA = cleanReport(lastContent.substring(aStart, aEnd));
    }
    if (bMatch && bMatch.index !== undefined) {
      const bStart = lastContent.indexOf('\n', bMatch.index) + 1;
      reportB = cleanReport(lastContent.substring(bStart));
    }
    return { reportA, reportB };
  } catch {
    return { reportA: '', reportB: '' };
  }
}

function getEffectiveReport(session: any, type: 'reportA' | 'reportB'): string {
  const saved = type === 'reportA' ? session?.fullReport : session?.actionGuide;
  if (saved) return cleanReport(saved);
  const fb = extractFromChatHistory(session?.chatHistory);
  const extracted = type === 'reportA' ? fb.reportA : fb.reportB;
  if (extracted) return extracted;
  return type === 'reportA' ? '暂无备战报告。' : '暂无交流建议。';
}

export default function ReviewPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="w-14 h-14 border-4 border-slate-100 border-t-primary rounded-full animate-spin shadow-sm" />
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">复盘系统载入中...</span>
          </div>
        </div>
      </div>
    }>
      <ReviewPageContent />
    </Suspense>
  );
}

function ReviewPageContent() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('review');
  const [userName, setUserName] = useState<string>('销售专家');
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const [completedNodes, setCompletedNodes] = useState<Record<number, { summary: string, quality: string }>>({});
  const [prepData, setPrepData] = useState<Record<number, any>>({});
  const [history, setHistory] = useState<any[]>([]);
  
  const [isFinished, setIsFinished] = useState(false);
  const [reportA, setReportA] = useState('');
  const [reportB, setReportB] = useState('');
  const [accScore, setAccScore] = useState(0);
  const [adhScore, setAdhScore] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(savedUser);
    setUserName(user.name);
    setIsAdmin(user.isAdmin || false);
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error('Session not found');
      const data = await res.json();
      
      setSession(data);
      setHistory(data.reviewChatHistory ? JSON.parse(data.reviewChatHistory) : []);
      
      const prepChecklist = data.checklistData ? JSON.parse(data.checklistData) : {};
      setPrepData(prepChecklist);

      const reviewChecklist = data.reviewChecklistData ? JSON.parse(data.reviewChecklistData) : {};
      // Backward compatibility: Convert string summaries to objects
      const migrated = Object.entries(reviewChecklist).reduce((acc: Record<number, any>, [key, val]: [string, any]) => {
        acc[Number(key)] = typeof val === 'string' ? { summary: val, quality: 'GREEN' } : val;
        return acc;
      }, {});
      setCompletedNodes(migrated);
      
      if (data.isReviewed) {
        setIsFinished(true);
        setReportA(data.diagnosticLetter || '');
        setReportB(data.nextStepInstructions || '');
        setAccScore(data.accuracyScore || 0);
        setAdhScore(data.adherenceScore || 0);
        setActiveTab('reports');
      }
      
      setIsLoaded(true);
    } catch (e) {
      toast.error('载入失败');
      router.push('/history');
    }
  };

  const handleNodeConfirmed = (nodeId: number, summary: string, quality?: string) => {
    setCompletedNodes(prev => ({
      ...prev,
      [nodeId]: { summary, quality: quality || 'GREEN' }
    }));
  };

  const handleComplete = async (content: string, acc: number, adh: number) => {
    const aMarker = /交付物\s*A/;
    const bMarker = /交付物\s*B/;
    let aPart = "";
    let bPart = "";
    const aMatch = content.match(aMarker);
    const bMatch = content.match(bMarker);
    if (aMatch && bMatch) {
      aPart = content.substring(aMatch.index!, bMatch.index!).trim();
      bPart = content.substring(bMatch.index!).replace(/\[[^\]]+\]/g, '').trim();
    } else {
      aPart = content.replace(/\[[^\]]+\]/g, '').trim();
    }

    setReportA(aPart);
    setReportB(bPart);
    setAccScore(acc);
    setAdhScore(adh);
    setIsFinished(true);
    setActiveTab('reports');

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isReviewed: true,
          diagnosticLetter: aPart,
          nextStepInstructions: bPart,
          accuracyScore: acc,
          adherenceScore: adh,
          reviewChecklistData: [1,2,3,4,5,6].reduce((acc, curr) => ({ ...acc, [curr]: "完成总结" }), {})
        })
      });
    } catch (e) { console.error(e); }
  };

  const handleSave = async (messages: any[]) => {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewChatHistory: messages,
          reviewChecklistData: completedNodes
        })
      });
      setHistory(messages);
    } catch (e) { console.error(e); }
  };

  const handleDraftSave = async () => {
    await handleSave(history);
    toast.success('复盘对话已存入暂存库');
    router.push('/review-drafts');
  };

  if (!isLoaded) return null;

  const overallScore = isFinished ? Math.round((accScore + adhScore) / 2) : null;

  return (
    <main className="flex h-screen w-full overflow-hidden bg-slate-50 flex-col font-sans antialiased text-slate-900">
      <MainHeader userName={userName} activePage="history" isAdmin={isAdmin} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Session List */}
        <div className="w-[30%] h-full bg-white border-r border-slate-100 flex flex-col shadow-sm relative z-20">
          <ReviewRadarBoard 
            completedSteps={completedNodes} 
            prepData={prepData}
            hasStarted={history.length > 0}
          />
        </div>

        {/* Right Content Area */}
        <div className="w-[70%] h-full bg-slate-50 overflow-hidden flex flex-col p-2">
          <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            {/* Context Header */}
            <div className="px-10 pt-3 pb-0 border-b border-slate-50 flex flex-col gap-3 shrink-0 bg-slate-50/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none group flex items-center gap-2">
                        🎯 {session?.title || '任务加载中...'}
                      </h1>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isFinished && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 border-slate-200 text-slate-900 hover:text-red-600 hover:bg-red-50 font-bold text-sm gap-2 px-6 transition-all rounded-xl"
                        onClick={handleDraftSave}
                      >
                        <HistoryIcon className="w-4 h-4" />
                        暂存
                      </Button>
                    )}
                  </div>
                </div>

                {isFinished && (
                  <div className="flex items-center gap-5 bg-slate-50 p-4 px-8 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex flex-col items-center border-r border-slate-200 pr-5">
                      <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest mb-1 leading-none">综合报告评分</span>
                      <span className="text-3xl font-bold tracking-tighter text-primary">{overallScore}<span className="text-xs  opacity-30 ml-1">分</span></span>
                    </div>
                    <Trophy className="w-8 h-8 text-primary opacity-20" />
                  </div>
                )}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-slate-100 p-1 h-12 gap-1 rounded-xl w-fit">
                  <TabsTrigger value="plan" className="rounded-lg px-8 font-bold text-base h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-900 data-[state=active]:text-primary">
                    <FileText className="w-4 h-4 mr-2" />
                    销售备战核验
                  </TabsTrigger>
                  <TabsTrigger value="review" className="rounded-lg px-8 font-bold text-base h-full data-[state=active]:bg-white data-[state=active]:shadow-sm text-slate-900 data-[state=active]:text-primary">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    事后总结复盘 {isFinished ? '(已验证)' : '(进行中)'}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <Tabs value={activeTab} className="h-full">
                <TabsContent value="plan" className="h-full m-0 animate-in fade-in zoom-in-95 duration-500">
                  <ScrollArea className="h-full px-10 py-8">
                    <div className="prose prose-slate prose-lg max-w-none">
                      <section>
                        <h2 className="text-xl py-2 border-l-4 border-primary pl-4 font-bold">交付物 A：《全景备战报告》</h2>
                        <div className="mt-6 opacity-80">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{getEffectiveReport(session, 'reportA')}</ReactMarkdown>
                        </div>
                      </section>
                      <Separator />
                      <section className="mt-12">
                        <h2 className="text-xl py-2 border-l-4 border-primary pl-4 font-bold">交付物 B：《现场话术建议》</h2>
                        <div className="mt-6 opacity-80">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{getEffectiveReport(session, 'reportB')}</ReactMarkdown>
                        </div>
                      </section>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="review" className="h-full m-0 animate-in fade-in zoom-in-95 duration-500">
                  <ReviewChatInterface 
                    sessionId={sessionId}
                    initialMessages={history}
                    onStepConfirmed={handleNodeConfirmed}
                    onComplete={handleComplete}
                    onSave={handleSave}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Separator() {
  return <div className="w-full h-px bg-slate-50 my-10" />;
}
