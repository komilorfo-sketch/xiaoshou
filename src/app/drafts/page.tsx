"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  ChevronLeft, 
  History as HistoryIcon, 
  Target,
  LogOut,
  PlusCircle,
  Play,
  Calendar,
  User as UserIcon,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MainHeader } from '@/components/MainHeader';

interface DraftSession {
  id: string;
  title: string;
  createdAt: string;
  checklistData: string;
  user: {
    name: string;
  };
}

export default function DraftsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<DraftSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [userName, setUserName] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUserName(parsed.name);
      setIsAdmin(parsed.isAdmin || false);
    } else {
      router.push('/login');
    }
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setIsLoading(true);
      // Get userId from localStorage
      const savedUser = localStorage.getItem('user');
      const userId = savedUser ? JSON.parse(savedUser).id : null;

      if (!userId) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/history?type=draft&userId=${userId}`);
      if (!response.ok) throw new Error('获取数据失败');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      toast.error('载入暂存失败');
    } finally {
      setIsLoading(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('删除失败');
      
      toast.success('备战记录已删除');
      fetchDrafts();
    } catch (error) {
      toast.error('删除操作失败');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (window.confirm('确定要删除这项备战任务吗？删除后无法恢复。')) {
      executeDelete(id);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans antialiased text-slate-900 border-t-4 border-blue-600 flex-col overflow-hidden">
      <MainHeader userName={userName} activePage="drafts" isAdmin={isAdmin} />

      <div className="flex-1 max-w-5xl mx-auto w-full p-8 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3 text-slate-900">
              <HistoryIcon className="w-8 h-8 text-blue-600" />
              备战暂存
            </h1>
            <p className="text-slate-900 text-lg font-medium mt-1 uppercase tracking-widest">
              待继续的备战任务· 可随时归位锁定胜局
            </p>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-900" />
            <Input 
              placeholder="搜索暂存任务..." 
              className="pl-10 h-10 bg-white border-slate-200 shadow-sm text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-slate-900">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
              <span className="text-sm font-black uppercase tracking-widest">情报检索中...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                <HistoryIcon className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-900 text-lg font-bold uppercase tracking-widest">暂无备战</p>
              <Link href="/workspace">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-black text-base px-8 rounded-xl shadow-lg shadow-blue-100">
                  开启销售备战
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSessions.map((session) => {
                const checklist = JSON.parse(session.checklistData || '{}');
                const completedCount = Object.keys(checklist).length;

                return (
                  <Card key={session.id} className="group hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-xl bg-white rounded-3xl overflow-hidden border-2 border-slate-100">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <Badge variant="outline" className="text-xs font-black uppercase border-blue-600 text-blue-600 px-2">
                          进行中 {completedCount}/7
                        </Badge>
                        <div className="flex flex-col items-end text-xs text-slate-900 font-bold uppercase tracking-tighter">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 line-clamp-1 uppercase mb-4">
                        {session.title.replace(new RegExp(`^${session.user.name}(的|'s )?`, 'i'), '')}
                      </h3>
                      
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => router.push(`/workspace?id=${session.id}`)}
                          size="sm"
                          className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl gap-2 h-10 transition-all text-base"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          继续备战
                        </Button>
                        
                        <button 
                          type="button"
                          onClick={(e) => handleDelete(e, session.id)}
                          className="w-12 h-10 border border-slate-200 text-slate-900 hover:text-red-500 hover:border-red-100 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center bg-white"
                        >
                          <Trash2 className="w-4 h-4 pointer-events-none" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

// Simple Card component for layout since we didn't import the full shadcn card
function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
