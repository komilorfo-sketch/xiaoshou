'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, User, Bot, Loader2, Microscope, History as HistoryIcon, Brain, ChevronDown, ChevronRight, Search, Paperclip, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ReviewChatInterfaceProps {
  sessionId: string;
  initialMessages?: any[];
  onStepConfirmed: (stepId: number, summary: string, quality?: string) => void;
  onComplete: (fullContent: string, accuracy: number, adherence: number) => void;
  onSave?: (messages: any[]) => void;
}

export function ReviewChatInterface({ sessionId, initialMessages = [], onStepConfirmed, onComplete, onSave }: ReviewChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<{ name: string; content: string }[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 1024 * 1024 * 5) { // 5MB limit
        // Assuming toast is available or using a simple alert/console for now if not imported
        console.warn(`${file.name} 超过 5MB`);
        continue;
      }

      const fileNameLower = file.name.toLowerCase();
      const isText = fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.md') || fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.json');

      if (!isText) {
        setAttachments(prev => [...prev, { name: file.name, content: "[非文本格式]" }]);
        toast.info(`${file.name} 格式暂不支持内容深度解析`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setAttachments(prev => [...prev, { name: file.name, content }]);
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/review',
    body: { sessionId },
    initialMessages,
    onFinish: (message) => {
      const content = message.content;
      
      // 1. Parse confirmed items [ITEM_CONFIRMED: X] [SUMMARY: ...] [QUALITY: ...]
      const confirmMatches = content.matchAll(/\[ITEM_CONFIRMED:\s*(\d+)\]\s*(?:\[SUMMARY:\s*([^\]]+)\])?\s*(?:\[QUALITY:\s*([^\]]+)\])?/g);
      for (const m of confirmMatches) {
        onStepConfirmed(parseInt(m[1]), m[2] || "已确认", m[3] || "GREEN");
      }

      // 2. Parse Scores & Completion
      const isComplete = content.includes('[SESSION_COMPLETE]');
      const accuracyMatch = content.match(/\[ACCURACY_SCORE:\s*(\d+)\]/);
      const adherenceMatch = content.match(/\[ADHERENCE_SCORE:\s*(\d+)\]/);

      if (isComplete && accuracyMatch && adherenceMatch) {
        onComplete(content, parseInt(accuracyMatch[1]), parseInt(adherenceMatch[1]));
      }

      // 3. Auto-save history
      if (onSave) {
        onSave([...messages, message]);
      }
    },
  });

  const onHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    let finalInput = input;
    if (attachments.length > 0) {
      const attachmentContext = attachments
        .map(a => `[ATTACHED_FILE: ${a.name}]\n${a.content}\n[END_FILE]`)
        .join('\n\n');
      finalInput = `${input}\n\n以下是复盘过程中提供的补充文档数据：\n${attachmentContext}`;
    }

    handleSubmit(e, { 
      body: { 
        content: finalInput,
        sessionId // Preserve session identity
      } 
    });
    setAttachments([]);
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        const form = e.currentTarget.form;
        if (form) form.requestSubmit();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden font-sans">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full w-full" ref={scrollRef} type="always">
          <div className="max-w-4xl mx-auto space-y-4 pb-4 px-8 py-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-2 border border-slate-100 animate-bounce transition-transform duration-1000">
                  <Bot className="w-14 h-14 text-red-500" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">战场打扫开始</h3>
                <p className="max-w-xl text-xl font-black text-rose-600 tracking-tight leading-tight">
                  请先用一句话告诉我，今天这仗是赢了、待继续、还是败了？
                </p>
              </div>
            )}

            {messages.map((m) => {
              const displayContent = m.content
                .replace(/\[ITEM_CONFIRMED:\s*(\d+)\]/g, '')
                .replace(/\[SUMMARY:\s*([^\]]+)\]/g, '')
                .replace(/\[QUALITY:\s*([^\]]+)\]/g, '')
                .replace(/\[ACCURACY_SCORE:\s*(\d+)\]/g, '')
                .replace(/\[ADHERENCE_SCORE:\s*(\d+)\]/g, '')
                .replace(/\[SESSION_COMPLETE\]/g, '');

              return (
                <div key={m.id} className={cn("flex items-start gap-4", m.role === 'user' ? "justify-end" : "justify-start")}>
                  {m.role !== 'user' && (
                    <div className="mt-1 w-10 h-10 rounded-xl bg-slate-900 flex-shrink-0 flex items-center justify-center shadow-xl">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "rounded-2xl px-6 py-4 shadow-sm border max-w-[85%]",
                    m.role === 'user' 
                      ? "bg-red-600 text-white border-red-500 rounded-tr-none" 
                      : "bg-white text-slate-800 border-slate-100 rounded-tl-none"
                  )}>
                    <div className={cn("prose prose-base max-w-none", m.role === 'user' ? "prose-invert" : "prose-slate")}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
                    </div>
                  </div>

                  {m.role === 'user' && (
                    <div className="mt-1 w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} className="h-0 w-full" />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="flex-none bg-white border-t p-3 z-10 shadow-2xl">
        {/* Attachment Preview Bar */}
        {attachments.length > 0 && (
          <div className="max-w-4xl mx-auto mb-2 flex flex-wrap gap-2 px-1 animate-in slide-in-from-bottom-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-100 shadow-sm">
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => removeAttachment(idx)} className="hover:text-red-900 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={onHandleSubmit} className="max-w-4xl mx-auto flex gap-4 items-end">
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="请陈述现场事实（赢了 / 输了 / 待继续）..."
            className="flex-1 min-h-[80px] max-h-48 resize-none bg-slate-50 border-slate-200 focus-visible:ring-red-600 rounded-2xl px-6 py-4 text-lg font-medium"
          />
          <div className="flex flex-col gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              multiple 
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="h-14 w-14 rounded-2xl bg-red-600 hover:bg-red-700 shadow-xl shadow-red-100 flex items-center justify-center p-0 shrink-0"
            >
              <Send className="w-7 h-7" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
