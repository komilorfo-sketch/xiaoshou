'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, User, Bot, Loader2, ShieldCheck, History as HistoryIcon, Brain, ChevronDown, ChevronRight, Search, Paperclip, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  onStepConfirmed: (stepId: number) => void;
  onStatusUpdate: (stepId: number, quality: string, progress: string) => void;
  onComplete: (fullContent: string) => void;
  onSave?: (messages: any[], overrideTitle?: string, isCompleted?: boolean) => void;
  onTitleUpdate?: (title: string) => void;
  initialMessages?: any[];
  sessionId?: string;
}

// Remove [THOUGHTS: ...] blocks by counting bracket depth, so nested brackets
// inside THOUGHTS content (e.g. expert tags) don't cause premature truncation.
function removeThoughtsBlocks(text: string): string {
  const TAG = '[THOUGHTS:';
  let result = '';
  let i = 0;

  while (i < text.length) {
    const tagIdx = text.indexOf(TAG, i);
    if (tagIdx === -1) {
      result += text.slice(i);
      break;
    }
    result += text.slice(i, tagIdx);
    let depth = 1;
    let j = tagIdx + TAG.length;
    while (j < text.length && depth > 0) {
      if (text[j] === '[') depth++;
      else if (text[j] === ']') depth--;
      j++;
    }
    i = j;
  }

  return result;
}

export function ChatInterface({ onStepConfirmed, onStatusUpdate, onComplete, onSave, onTitleUpdate, initialMessages = [], sessionId }: ChatInterfaceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<{ name: string; content: string }[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 1024 * 1024 * 5) { // 5MB limit
        toast.error(`${file.name} 超过 5MB，请分批上传`);
        continue;
      }

      const fileNameLower = file.name.toLowerCase();
      const isText = fileNameLower.endsWith('.txt') || fileNameLower.endsWith('.md') || fileNameLower.endsWith('.csv') || fileNameLower.endsWith('.json');

      if (!isText) {
        setAttachments(prev => [...prev, { name: file.name, content: "[目前仅支持纯文本分析]" }]);
        toast.info(`${file.name} 格式暂不支持内容深度解析，仅限纯文本文档`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setAttachments(prev => [...prev, { name: file.name, content }]);
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages,
    onFinish: (message) => {
      // PREVENT DESYNC: Ignore anything inside [THOUGHTS] tags when parsing progress
      const rawContent = message.content;
      const cleanContentForParsing = removeThoughtsBlocks(rawContent).trim();
      
      // 1. Parse confirmed items FROM CLEAN CONTENT
      const confirmMatches = cleanContentForParsing.matchAll(/\[ITEM_CONFIRMED:\s*(\d+)\]/g);
      for (const m of confirmMatches) {
        onStepConfirmed(parseInt(m[1]));
      }

      // 2. Parse all quality and progress markers FROM CLEAN CONTENT
      const allQuality = cleanContentForParsing.matchAll(/\[ITEM_QUALITY:\s*(\d+):\s*(\w+)\]/g);
      const allProgress = cleanContentForParsing.matchAll(/\[ITEM_PROGRESS:\s*(\d+):\s*([^\]]+)\]/g);
      
      const statusUpdates: Record<number, { quality?: string, progress?: string }> = {};
      
      for (const m of allQuality) {
        const id = parseInt(m[1]);
        statusUpdates[id] = { ...statusUpdates[id], quality: m[2] };
      }
      
      for (const m of allProgress) {
        const id = parseInt(m[1]);
        const progressVal = m[2].trim();
        statusUpdates[id] = { ...statusUpdates[id], progress: progressVal };
      }
      
      for (const idStr in statusUpdates) {
        const id = parseInt(idStr);
        const { quality, progress } = statusUpdates[id];
        if (quality || progress) {
          onStatusUpdate(id, quality || '', progress || '');
        }
      }

      // 3. Parse Session Title
      const titleMatch = cleanContentForParsing.match(/\[SESSION_TITLE:\s*([^\]]+)\]/);
      if (titleMatch && titleMatch[1] && onTitleUpdate) {
        onTitleUpdate(titleMatch[1].trim());
      }

      // 4. Parse SESSION_COMPLETE
      const isComplete = cleanContentForParsing.includes('[SESSION_COMPLETE]');
      if (isComplete) {
        onComplete(rawContent);
      }
    },
  });

  // Custom handle submit to include attachments
  const onHandleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    let finalInput = input;
    if (attachments.length > 0) {
      const attachmentContext = attachments
        .map(a => `[ATTACHED_FILE: ${a.name}]\n${a.content}\n[END_FILE]`)
        .join('\n\n');
      finalInput = `${input}\n\n以下是提供的附件数据：\n${attachmentContext}`;
    }

    handleSubmit(e, { 
      body: { 
        content: finalInput,
        sessionId // Ensure sessionId is preserved
      } 
    });
    setAttachments([]);
  };

  // Persistance Sync: Only save when the AI stops loading and messages have been fully updated
  const lastSavedLength = useRef(initialMessages.length);
  useEffect(() => {
    if (!isLoading && messages.length > lastSavedLength.current) {
      // Check if last message is from AI (session is stable)
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'assistant') {
        const isComplete = lastMessage.content.includes('[SESSION_COMPLETE]');
        const titleMatch = lastMessage.content.match(/\[SESSION_TITLE:\s*([^\]]+)\]/);
        const detectedTitle = titleMatch ? titleMatch[1].trim() : undefined;
        
        onSave?.(messages, detectedTitle, isComplete);
        lastSavedLength.current = messages.length;
      }
    }
  }, [messages, isLoading, onSave]);

  // Handle auto-scroll only
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
    <div className="flex flex-col h-full max-h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-6 py-1 bg-white/90 backdrop-blur-sm border-b sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-lg shadow-slate-200">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 tracking-tight text-lg">备战教练</h2>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onSave && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 border-slate-200 text-slate-900 hover:text-blue-600 hover:bg-blue-50 font-bold text-sm gap-2 px-4 transition-all"
              onClick={() => onSave(messages)}
            >
              <HistoryIcon className="w-4 h-4" />
              暂存
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea 
          className="h-full w-full" 
          ref={scrollRef}
          type="always"
        >
          <div className="max-w-4xl mx-auto space-y-4 pb-4 px-4 md:px-8 pt-2 pb-10">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-24 h-24 rounded-3xl bg-white shadow-2xl flex items-center justify-center mb-2 border border-slate-100 animate-bounce transition-transform duration-1000">
                  <Bot className="w-14 h-14 text-red-500" />
                </div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">首战即决战</h3>
                <p className="max-w-xl text-xl font-black text-rose-600 tracking-tight leading-tight">
                  我们的终极目标只有一个：当场签单！请扔进你掌握的客户背景与思路。
                </p>
              </div>
            )}

              {messages.map((m) => (
                <MemoizedChatMessage 
                  key={m.id} 
                  role={m.role} 
                  content={m.content} 
                  isLoading={isLoading && m.id === messages[messages.length - 1].id}
                />
              ))}
            
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-start gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center shadow-lg">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <span className="text-base text-slate-900">正在制定战术策略...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-0 w-full" />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="flex-none bg-white border-t p-2 z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        {/* Attachment Preview Bar */}
        {attachments.length > 0 && (
          <div className="max-w-4xl mx-auto mb-2 flex flex-wrap gap-2 px-1 animate-in slide-in-from-bottom-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 shadow-sm">
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => removeAttachment(idx)} className="hover:text-blue-900 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form 
          onSubmit={onHandleSubmit} 
          className="max-w-4xl mx-auto relative flex gap-3 items-end"
        >
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="请输入客户信息或售前思路（Enter 发送，Shift + Enter 换行）..."
              className="w-full min-h-[60px] max-h-48 resize-none bg-slate-50 border-slate-200 focus-visible:ring-blue-600 focus-visible:border-transparent rounded-xl px-6 py-4 text-lg transition-all placeholder:text-slate-400"
              rows={3}
            />
          </div>

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
              className="h-10 w-10 rounded-xl border-slate-200 text-slate-900 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              className="h-14 w-14 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center p-0 shrink-0"
            >
              <Send className="w-6 h-6" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
const MemoizedChatMessage = React.memo(ChatMessage);

function ChatMessage({ role, content, isLoading }: { role: string, content: string, isLoading: boolean }) {
  const [showThoughts, setShowThoughts] = useState(false);
  const isAI = role !== 'user';

  // Memoize the expensive regex processing for each message
  const { thoughts, finalMessage } = React.useMemo(() => {
    if (!isAI) return { thoughts: null, finalMessage: content };

    const displayContent = content
      .replace(/\[ITEM_CONFIRMED:\s*(\d+)?\]/g, '')
      .replace(/\[ITEM_QUALITY:[^\]]*\]?/g, '')
      .replace(/\[ITEM_PROGRESS:[^\]]*\]?/g, '')
      .replace(/\[SESSION_TITLE:[^\]]*\]?/g, '')
      .replace(/\[SESSION_COMPLETE\]/g, '');

    const thoughtsMatch = displayContent.match(/\[THOUGHTS:\s*([\s\S]*?)\]/);
    const extractedThoughts = thoughtsMatch ? thoughtsMatch[1].trim() : null;
    const finalCleanMessage = displayContent.replace(/\[THOUGHTS:\s*([\s\S]*?)\]/g, '').trim();

    return { 
      thoughts: extractedThoughts, 
      finalMessage: finalCleanMessage 
    };
  }, [content, isAI]);

  return (
    <div className={cn("flex items-start gap-4", isAI ? "justify-start" : "justify-end")}>
      {isAI && (
        <div className="mt-1 w-8 h-8 rounded-lg bg-slate-900 flex-shrink-0 flex items-center justify-center shadow-lg">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className="flex flex-col gap-2 max-w-[85%]">
        {/* Thoughts Block - Collaborative Intelligence Style */}
        {isAI && thoughts && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl overflow-hidden transition-all">
            <button 
              onClick={() => setShowThoughts(!showThoughts)}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-indigo-100/50 transition-colors text-indigo-600"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs font-black uppercase tracking-widest">战略研讯进行中...</span>
              </div>
              {showThoughts ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {showThoughts && (
              <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="prose prose-xs prose-indigo border-t border-indigo-100 pt-3 text-indigo-900/70 text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {thoughts}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}

        <div 
          className={cn(
            "rounded-2xl px-5 py-3 shadow-sm border",
            isAI 
              ? "bg-white text-slate-800 border-slate-100 rounded-tl-none" 
              : "bg-[#0066ff] text-white border-[#0055ee] rounded-tr-none"
          )}
        >
          <div className={cn(
            "prose prose-base max-w-none prose-headings:font-bold prose-p:leading-relaxed",
            isAI ? "prose-slate" : "prose-invert"
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {finalMessage}
            </ReactMarkdown>
            {isAI && isLoading && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-blue-600 animate-pulse align-middle" />
            )}
          </div>
        </div>
      </div>

      {!isAI && (
        <div className="mt-1 w-8 h-8 rounded-lg bg-blue-100 flex-shrink-0 flex items-center justify-center border border-blue-200">
          <User className="w-5 h-5 text-blue-600" />
        </div>
      )}
    </div>
  );
}
