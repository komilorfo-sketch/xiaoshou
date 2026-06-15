'use client';

import React from 'react';
import { CheckCircle2, Circle, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RadarBoardProps {
  completedSteps: number[];
  stepStatuses?: Record<number, { quality: string, progress: string }>;
}

const steps = [
  { id: 1, title: '商机溯源', desc: '把握初始信任与破冰难度' },
  { id: 2, title: '盘子与购买力', desc: '确认体量、趋势与购买习惯' },
  { id: 3, title: '决策链与内线', desc: '锁定决策者，建立内部眼线' },
  { id: 4, title: '痛点与武器映射', desc: '精准打击，匹配公司核心产品' },
  { id: 5, title: '同行案例与背书', desc: '利用成功案例施压与增信' },
  { id: 6, title: '售前专家资源匹配', desc: '精准调配兵力，压制对手' },
  { id: 7, title: '价格策略与合同', desc: '分档推进，确保当场绝杀' },
];

export function RadarBoard({ completedSteps, stepStatuses = {} }: RadarBoardProps) {
  // The truly active step is the first step that isn't completed yet
  const activeStepId = steps.find(s => !completedSteps.includes(s.id))?.id || 8;

  return (
    <Card className="h-full border-none rounded-none bg-white text-slate-900 shadow-xl flex flex-col font-sans">
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4 pt-6 px-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
            <ClipboardCheck className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg font-black tracking-tight text-slate-900">
            销售备战检查清单
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden bg-white">
        <ScrollArea className="h-full px-6 py-6">
          <div className="space-y-3">
            {steps.map((step) => {
              const isCompleted = completedSteps.includes(step.id);
              const isActive = activeStepId === step.id;

              return (
                <div
                  key={step.id}
                  className={cn(
                    "relative pl-10 pb-2 last:pb-0 transition-all duration-300",
                    isCompleted || isActive ? "opacity-100" : "opacity-40"
                  )}
                >
                  {/* Timeline Line */}
                  {step.id < 7 && (
                    <div
                      className={cn(
                        "absolute left-[9px] top-6 w-[1.5px] h-full transition-colors duration-500",
                        isCompleted ? "bg-primary" : "bg-slate-100"
                      )}
                    />
                  )}

                  {/* Icon Wrapper */}
                  <div className="absolute left-0 top-0.5">
                    <div 
                      className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-500",
                        stepStatuses[step.id]?.quality === 'GREEN' ? "bg-emerald-500 border-emerald-400 text-white" :
                        stepStatuses[step.id]?.quality === 'YELLOW' ? "bg-amber-400 border-amber-300 text-white" :
                        stepStatuses[step.id]?.quality === 'RED' ? "bg-rose-500 border-rose-400 text-white" :
                        isCompleted ? "bg-primary border-primary shadow-[0_0_10px_rgba(0,102,255,0.2)] text-white" : 
                        isActive ? "bg-white border-primary shadow-lg scale-110 z-10" :
                        "bg-slate-50 border-slate-200"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isActive ? (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      ) : (
                        <Circle className="w-3 h-3 text-slate-900" />
                      )}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div
                    className={cn(
                      "p-3 rounded-2xl border transition-all duration-300 flex flex-col gap-1.5",
                      isCompleted 
                        ? "bg-slate-50/50 border-slate-100" 
                        : isActive 
                          ? "bg-white border-primary/20 shadow-md ring-1 ring-primary/5" 
                          : "bg-white border-slate-100/50"
                    )}
                  >
                    <div className="flex justify-between items-center px-1">
                      <h3 className={cn(
                        "font-bold tracking-tight",
                        isCompleted ? "text-slate-900 text-lg" : isActive ? "text-primary text-lg" : "text-slate-900 text-base"
                      )}>
                        {step.id}. {step.title}
                      </h3>
                      {stepStatuses[step.id]?.quality === 'GREEN' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                      {stepStatuses[step.id]?.quality === 'YELLOW' && <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />}
                      {stepStatuses[step.id]?.quality === 'RED' && <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />}
                    </div>
                    
                    <p className={cn(
                      "text-sm font-semibold leading-relaxed px-1",
                      isCompleted || isActive ? "text-slate-900" : "text-slate-900"
                    )}>
                      {step.desc}
                    </p>

                    {stepStatuses[step.id]?.progress && (
                      <div className={cn(
                        "mt-1 p-3 rounded-xl bg-amber-50/50 border border-amber-200/50 text-sm leading-relaxed transition-all tracking-tight text-slate-900 font-bold"
                      )}>
                        {stepStatuses[step.id].progress.replace(/\[[^\]]+\]/g, '').trim()}
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
