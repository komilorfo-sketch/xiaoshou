'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldAlert, UserCheck, Sword, ShieldOff, CreditCard, Flag, Telescope, Circle } from 'lucide-react';

interface ReviewRadarBoardProps {
  completedSteps: Record<number, { summary: string, quality: string }>;
  activeStep?: number;
  prepData?: Record<number, { quality: string, progress: string }>;
  hasStarted?: boolean;
}

const reviewSteps = [
  { id: 1, title: '决策链与内线验证', fullTitle: '决策链与内线验真', desc: '核心决策者是否现身？内线是否发挥实质助攻效用？', icon: UserCheck },
  { id: 2, title: '业务痛点与隐性诉求', fullTitle: '痛点与个人诉求确认', desc: '企业真实痛点是否校准？决策人的隐性 KPI 与避险诉求是否摸透？', icon: ShieldAlert },
  { id: 3, title: '方案效力与专家势能', fullTitle: '武器效力与专家复盘', desc: '客户对主推方案是否认可？随行专家的专业势能是否实现降维打击？', icon: Sword },
  { id: 4, title: '案例背书与异议洞察', fullTitle: '背书效力与核心抗拒', desc: '标杆案例施压是否见效？客户当前的核心异议与真实顾虑是什么？', icon: ShieldOff },
  { id: 5, title: '商务博弈与底线防守', fullTitle: '商务进度与底线防守', desc: '报价让步策略执行到哪一步？商务底牌与合规底线是否被突破？', icon: CreditCard },
  { id: 6, title: '推进承诺与下一步 (Next Step)', fullTitle: '推进承诺与下一步 (Next Step)', desc: '现场是否达成实质性推进承诺？唯一明确的下一步行动是什么？', icon: Flag },
];

const prepSteps = [
  { id: 1, title: '商机溯源' },
  { id: 2, title: '盘子购买力' },
  { id: 3, title: '决策链内线' },
  { id: 4, title: '痛点匹配' },
  { id: 5, title: '同行案例' },
  { id: 6, title: '专家匹配' },
  { id: 7, title: '价格合同' },
];

export function ReviewRadarBoard({ completedSteps, activeStep, prepData = {}, hasStarted = false }: ReviewRadarBoardProps) {
  const completedIds = Object.keys(completedSteps).map(Number);
  const currentActiveId = activeStep || reviewSteps.find(s => !completedIds.includes(s.id))?.id || 7;

  return (
    <Card className="h-full border-none rounded-none bg-white text-slate-900 shadow-xl flex flex-col font-sans">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4 pt-6 px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <Telescope className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg font-black tracking-tight text-slate-900">
            事后总结复盘
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden bg-white">
        <ScrollArea className="h-full px-6 py-6">
          <div className="space-y-3">
            {reviewSteps.map((step) => {
              const stepData = completedSteps[step.id];
              const isCompleted = !!stepData;
              const isActive = currentActiveId === step.id;
              
              // Use the Review-specific quality for the indicator
              const reviewQuality = stepData?.quality || 'GREEN';

              return (
                <div
                   key={step.id}
                   className={cn(
                     "relative pl-10 pb-2 last:pb-0 transition-all duration-300",
                     isCompleted || isActive ? "opacity-100" : "opacity-40"
                   )}
                >
                  {/* Timeline Line */}
                  {step.id < 6 && (
                    <div className={cn(
                      "absolute left-[9px] top-6 w-[1.5px] h-full transition-colors duration-500",
                      isCompleted ? "bg-primary" : "bg-slate-100"
                    )} />
                  )}

                  {/* Icon Wrapper */}
                  <div className="absolute left-0 top-0.5">
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-500",
                      isCompleted && reviewQuality === 'GREEN' ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]" : 
                      isCompleted && reviewQuality === 'YELLOW' ? "bg-amber-400 border-amber-300 text-white shadow-[0_0_10px_rgba(251,191,36,0.3)]" :
                      isCompleted && reviewQuality === 'RED' ? "bg-rose-500 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]" :
                      isActive ? "bg-white border-primary shadow-lg scale-110 z-10" :
                      "bg-slate-50 border-slate-200"
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (isActive && hasStarted) ? (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <Circle className={cn("w-3 h-3 text-slate-900")} />
                      )}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className={cn(
                    "p-3 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5",
                    isCompleted 
                      ? "bg-slate-50/50 border-slate-100" 
                      : isActive 
                        ? "bg-white border-primary/20 shadow-md ring-1 ring-primary/5" 
                        : "bg-white border-slate-100/50"
                  )}>
                    <div className="flex justify-between items-center px-1">
                      <h3 className={cn(
                        "font-bold tracking-tight",
                        isCompleted ? "text-slate-900 text-lg" : isActive ? "text-primary text-lg" : "text-slate-900 text-base"
                      )}>
                        {step.id}. {step.title}
                      </h3>
                      {/* Status dot on the right removed as requested */}
                    </div>
                    
                    <p className={cn(
                      "text-sm font-semibold leading-relaxed px-1",
                      isCompleted || isActive ? "text-slate-900" : "text-slate-900"
                    )}>
                      {step.desc}
                    </p>

                    {stepData?.summary && (
                      <div className={cn(
                        "mt-1 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50 text-sm leading-relaxed transition-all tracking-tight text-slate-900 font-bold"
                      )}>
                        {stepData.summary.replace(/\[[^\]]+\]/g, '').trim()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Simple internal component for the checkmark
function CheckCircle2({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      {...props}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
