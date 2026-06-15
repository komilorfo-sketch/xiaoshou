"use client";

import React from 'react';
import Link from 'next/link';
import { Target, PlusCircle, History as HistoryIcon, LogOut, Share2, FileText, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface MainHeaderProps {
  userName: string;
  activePage: 'workspace' | 'history' | 'drafts' | 'review-drafts' | 'shared' | 'admin-users';
  isAdmin?: boolean;
}

export function MainHeader({ userName, activePage, isAdmin }: MainHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-30 shadow-sm shrink-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group cursor-pointer hover:bg-primary/20 transition-all">
          <Target className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            销售备战
          </h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-slate-900 hover:text-primary hover:bg-primary/5 font-bold text-base gap-1.5 px-3 transition-all"
          onClick={() => window.location.href = '/workspace'}
        >
          <PlusCircle className="w-4 h-4" />
          新建备战
        </Button>
        
        <Link href="/history">
          <Button variant="ghost" size="sm" className="text-slate-900 hover:text-primary hover:bg-primary/5 font-bold text-base gap-1.5 px-3 transition-all">
            <HistoryIcon className="w-4 h-4" />
            历史库
          </Button>
        </Link>

        <Link href="/shared">
          <Button variant="ghost" size="sm" className={`font-bold text-base gap-1.5 px-3 transition-all ${activePage === 'shared' ? 'text-primary bg-primary/5' : 'text-slate-900 hover:text-primary hover:bg-primary/5'}`}>
            <Share2 className="w-4 h-4" />
            共享库
          </Button>
        </Link>

        <Link href="/drafts">
          <Button variant="ghost" size="sm" className="text-slate-900 hover:text-primary hover:bg-primary/5 font-bold text-base gap-1.5 px-3 transition-all">
            <FileText className="w-4 h-4" />
            备战暂存库
          </Button>
        </Link>

        <Link href="/review-drafts">
          <Button variant="ghost" size="sm" className={`font-bold text-base gap-1.5 px-3 transition-all ${activePage === 'review-drafts' ? 'text-primary bg-primary/5' : 'text-slate-900 hover:text-primary hover:bg-primary/5'}`}>
            <HistoryIcon className="w-4 h-4" />
            复盘暂存库
          </Button>
        </Link>

        {isAdmin && (
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className={`font-bold text-base gap-1.5 px-3 transition-all ${activePage === 'admin-users' ? 'text-primary bg-primary/5' : 'text-slate-900 hover:text-primary hover:bg-primary/5'}`}>
              <UserCog className="w-4 h-4" />
              用户管理
            </Button>
          </Link>
        )}

        <div className="h-6 w-[1px] bg-slate-100 mx-2" />
        
        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end">
            <span className="text-base font-bold text-slate-900 leading-none">{userName}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center text-slate-900 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
