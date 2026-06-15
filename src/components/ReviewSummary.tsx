'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Zap, Share2, CheckCircle, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReviewSummaryProps {
  diagnosticLetter: string;
  nextSteps: string;
  accuracyScore: number;
  adherenceScore: number;
  onShare?: () => void;
}

export function ReviewSummary({ diagnosticLetter, nextSteps, accuracyScore, adherenceScore, onShare }: ReviewSummaryProps) {
  const isHighPerformance = (accuracyScore + adherenceScore) / 2 >= 85;

  const handleShare = () => {
    toast.success("已完成脱敏处理，成功分享至企业公有备战库！", {
      description: "该高分战例已沉淀为企业 RAG 知识资产。"
    });
    if (onShare) onShare();
  };

  return (
    <div className="flex flex-col h-full bg-white relative animate-in fade-in zoom-in-95 duration-500">
      {/* Reports area */}
      <Tabs defaultValue="letter" className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-none px-8 border-b bg-white">
          <div className="flex justify-between items-center">
            <TabsList className="bg-transparent h-14 gap-8">
              <TabsTrigger 
                value="letter" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-base font-black uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900"
              >
                <FileText className="w-4 h-4 mr-2" />
                战役复盘与落差诊断书
              </TabsTrigger>
              <TabsTrigger 
                value="steps" 
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-base font-black tracking-widest text-slate-400 data-[state=active]:text-slate-900"
              >
                <Zap className="w-4 h-4 mr-2" />
                战术补救/冲锋指令
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="letter" className="flex-1 overflow-hidden m-0 p-8 data-[state=active]:flex">
          <ScrollArea className="h-full w-full">
            <div className="prose prose-slate prose-lg max-w-none prose-strong:text-slate-900 prose-h2:font-black prose-h2:text-red-600 prose-h2:uppercase">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{diagnosticLetter}</ReactMarkdown>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="steps" className="flex-1 overflow-hidden m-0 p-8 data-[state=active]:flex">
          <ScrollArea className="h-full w-full">
            <div className="prose prose-slate prose-lg max-w-none prose-strong:text-slate-900 prose-h2:font-black prose-h2:text-blue-600 prose-h2:uppercase">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{nextSteps}</ReactMarkdown>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
