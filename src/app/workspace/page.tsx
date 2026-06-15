'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RadarBoard } from '@/components/RadarBoard';
import { ChatInterface } from '@/components/ChatInterface';
import { MainHeader } from '@/components/MainHeader';
import { toast } from 'sonner';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="w-14 h-14 border-4 border-slate-100 border-t-primary rounded-full animate-spin shadow-sm" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">系统加载中...</span>
          </div>
        </div>
      </div>
    }>
      <WorkspaceContent />
    </Suspense>
  );
}

function WorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepStatuses, setStepStatuses] = useState<Record<number, { quality: string, progress: string }>>({});
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [userName, setUserName] = useState<string>('销售专家');
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInitials, setUserInitials] = useState<string>('??');
  const [userId, setUserId] = useState<string>('');
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setUserName(user.name);
        setIsAdmin(user.isAdmin || false);
        setUserId(user.id);
        setUserInitials(user.name.slice(0, 2).toUpperCase());
        
        if (sessionId) {
          loadSession(sessionId);
        } else {
          setIsLoaded(true);
        }
      } catch (e) {
        console.error('Failed to parse user data');
        setIsLoaded(true);
      }
    } else {
      router.push('/login');
    }
  }, [router, sessionId]);

  const loadSession = async (id: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`);
      if (!response.ok) throw new Error('Session not found');
      const data = await response.json();
      
      const checklist = data.checklistData ? JSON.parse(data.checklistData) : {};
      setCompletedSteps(Object.keys(checklist).map(Number));
      setStepStatuses(checklist);
      setSessionTitle(data.title || '');
      setIsCompleted(data.isCompleted || false);
      setInitialMessages(data.chatHistory ? JSON.parse(data.chatHistory) : []);
      setIsLoaded(true);
    } catch (error) {
      console.error('Load session error:', error);
      toast.error('载入失败');
      setIsLoaded(true);
      router.replace('/workspace');
    }
  };

  const handleStepConfirmed = (stepId: number) => {
    setCompletedSteps((prev) => {
      const newSteps = [...prev];
      for (let i = 1; i <= stepId; i++) {
        if (!newSteps.includes(i)) newSteps.push(i);
      }
      return newSteps.sort((a, b) => a - b);
    });
  };

  const handleStatusUpdate = (stepId: number, quality: string, progress: string) => {
    setStepStatuses((prev) => ({
      ...prev,
      [stepId]: { 
        quality: quality || prev[stepId]?.quality || 'GREEN', 
        progress: progress || prev[stepId]?.progress || '' 
      }
    }));
  };

  const handleComplete = async (fullContent: string) => {
    setCompletedSteps([1, 2, 3, 4, 5, 6, 7]);
    const finalStatuses = {
      ...stepStatuses,
      7: { quality: 'GREEN', progress: '策略已确认，进入现场绝杀环节' }
    };
    setStepStatuses(finalStatuses);
    setIsCompleted(true);

    const cleanContent = (text: string) =>
      text
        .replace(/\[THOUGHTS:\s*[\s\S]*?\]/g, '')
        .replace(/\[THOUGHTS\]/g, '')
        .replace(/\[ITEM_CONFIRMED:\s*\d+\]/g, '')
        .replace(/\[ITEM_QUALITY:[^\]]*\]/g, '')
        .replace(/\[ITEM_PROGRESS:[^\]]*\]/g, '')
        .replace(/\[SESSION_TITLE:[^\]]*\]/g, '')
        .replace(/\[SESSION_COMPLETE\]/g, '')
        .trim();

    const extractSection = (content: string, marker: RegExp): { start: number; end: number } | null => {
      const match = content.match(marker);
      if (!match || match.index === undefined) return null;
      // Skip past the heading line
      const afterHeading = content.indexOf('\n', match.index);
      return {
        start: afterHeading === -1 ? match.index + match[0].length : afterHeading + 1,
        end: match.index,
      };
    };

    const reportAMarker = /(?:\*\*|###)?\s*交付物\s*A\s*[：:]?\s*《?.*全景备战报告》?/i;
    const reportBMarker = /(?:\*\*|###)?\s*交付物\s*B\s*[：:]?\s*《?现场交流建议及场景话术》?/i;

    let reportA = "";
    let reportB = "";

    const posA = extractSection(fullContent, reportAMarker);
    const posB = extractSection(fullContent, reportBMarker);

    if (posA && posB) {
      if (posA.end < posB.end) {
        reportA = cleanContent(fullContent.substring(posA.start, posB.end));
        reportB = cleanContent(fullContent.substring(posB.start));
      } else {
        reportB = cleanContent(fullContent.substring(posB.start, posA.end));
        reportA = cleanContent(fullContent.substring(posA.start));
      }
    } else if (posA) {
      reportA = cleanContent(fullContent.substring(posA.start));
    } else if (posB) {
      reportB = cleanContent(fullContent.substring(posB.start));
    } else {
      reportA = cleanContent(fullContent);
    }

    if (sessionId) {
      try {
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checklistData: finalStatuses,
            isCompleted: true,
            fullReport: reportA || undefined,
            actionGuide: reportB || undefined,
          }),
        });
        toast.success("备战推演已结案");
      } catch (e) { console.error(e); }
    }
  };

  const handleTitleUpdate = async (newTitle: string) => {
    setSessionTitle(newTitle);
    if (!sessionId) return;
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      toast.success(`名称更新: ${newTitle}`);
    } catch (e) { console.error(e); }
  };

  const handleManualSave = async (messages: any[], overrideTitle?: string, forceCompleted?: boolean) => {
    try {
      const currentId = sessionId;
      const method = currentId ? 'PATCH' : 'POST';
      const url = currentId ? `/api/sessions/${currentId}` : '/api/history';
      const payload = {
        userId,
        chatHistory: messages,
        checklistData: stepStatuses,
        isCompleted: forceCompleted !== undefined ? forceCompleted : isCompleted,
        title: overrideTitle || sessionTitle || `新备战任务 - ${new Date().toLocaleDateString()}`
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!currentId && data.id) {
        router.push(`/workspace?id=${data.id}`);
      }
      if (!forceCompleted) {
        toast.success("备战进度已保存");
      }
    } catch (e) { toast.error("保存失败"); }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden font-sans antialiased text-slate-900 bg-slate-50 flex-col">
      <MainHeader userName={userName} activePage="workspace" isAdmin={isAdmin} />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[30%] h-full border-r border-slate-100 shadow-sm relative z-20 bg-white">
          <RadarBoard completedSteps={completedSteps} stepStatuses={stepStatuses} />
        </div>
        <div className="w-[70%] h-full overflow-hidden relative z-10 bg-slate-50 p-2 flex flex-col">
          <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            {isLoaded && (
              <ChatInterface 
                initialMessages={initialMessages}
                onStepConfirmed={handleStepConfirmed} 
                onStatusUpdate={handleStatusUpdate}
                onComplete={handleComplete}
                onSave={handleManualSave}
                onTitleUpdate={handleTitleUpdate}
                sessionId={sessionId || undefined}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
