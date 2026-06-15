import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import prisma from '@/lib/db';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

const REGENERATE_PROMPT = `你是一名电气成套行业大单销售复盘专家。下面是一段已完成的销售备战对话记录，请根据对话中的全部情报，重新生成以下两份战术交付物。

**交付物 A：《电气成套售前全景备战报告》** —— 完整商机情报档案，必须包含以下 7 个章节，每章不得少于 3 段：
1. **商机溯源与背景**：客户是谁（行业/规模/区域），商机来源（转介绍/招标/陌拜），初始信任基础评估。
2. **盘子与购买力研判**：客户年采购规模估算，老板决策风格与付款习惯，我方适配的预算区间。
3. **决策链与内线布局**：画出决策链图谱（决策者/技术把关者/使用者/内线），注明已锁定与待攻克环节。
4. **痛点与武器映射**：逐条列出诊断出的客户痛点，每条匹配我方具体产品/服务，附竞品威胁研判。
5. **同行案例与背书武器**：选取 2-3 个高度近似的已交付案例，注明可用于施压的实证材料。
6. **专家兵力部署**：确定的随行专家及各自分工，专家出场时机与话术定位。
7. **价格策略与合同底线**：三档报价策略（锚定/主推/防守），合同预审状态，我方不可逾越的底线条款与可以让步的筹码清单。
*格式要求：每章使用二级标题（##），重要情报用加粗标注，数据部分尽量使用表格呈现。全文不少于 800 字。严禁在报告开头添加项目代号、备战日期、备战状态、制表人等元数据信息，直接从"## 1. 商机溯源与背景"开始输出。*

**交付物 B：《现场交流建议及场景话术》** —— 必须包含：1. 针对甲方/总包方的破冰话术；2. 痛点深挖与技术方案切入话术；3. 应对常见异议的防御话术；4. 促单动作。

注意：直接输出上述两份交付物，不要开启新对话，不要输出任何开场白或解释。`;

function cleanContent(text: string): string {
  return text
    .replace(/\[THOUGHTS:\s*[\s\S]*?\]/g, '')
    .replace(/\[ITEM_CONFIRMED:\s*\d+\]/g, '')
    .replace(/\[ITEM_QUALITY:[^\]]*\]/g, '')
    .replace(/\[ITEM_PROGRESS:[^\]]*\]/g, '')
    .replace(/\[SESSION_TITLE:[^\]]*\]/g, '')
    .replace(/\[SESSION_COMPLETE\]/g, '')
    .trim();
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.preSalesSession.findUnique({
      where: { id: params.id },
    });
    if (!session) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    const chatHistory = session.chatHistory;
    if (!chatHistory) {
      return NextResponse.json({ error: '无对话记录' }, { status: 400 });
    }

    let messages;
    try {
      messages = JSON.parse(chatHistory);
    } catch {
      return NextResponse.json({ error: '对话记录解析失败' }, { status: 400 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '对话记录为空' }, { status: 400 });
    }

    // Build conversation summary for the AI
    const convoText = messages
      .map((m: any) => `[${m.role === 'user' ? '销售' : '教练'}]: ${m.content}`)
      .join('\n\n');

    const response = await openai.chat.completions.create({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: REGENERATE_PROMPT },
        { role: 'user', content: `以下是已完成的销售备战对话记录，请据此生成上述两份交付物：\n\n${convoText}` },
      ],
      temperature: 0.3,
      max_tokens: 16384,
    });

    const rawContent = response.choices[0]?.message?.content || '';
    if (!rawContent) {
      return NextResponse.json({ error: 'AI 未返回内容' }, { status: 500 });
    }

    // Extract reports using same markers as workspace
    const reportAMarker = /(?:\*\*|###)?\s*交付物\s*A\s*[：:]\s*《?.*?全景备战报告》?/i;
    const reportBMarker = /(?:\*\*|###)?\s*交付物\s*B\s*[：:]\s*《?.*?现场交流建议及场景话术》?/i;

    const aMatch = rawContent.match(reportAMarker);
    const bMatch = rawContent.match(reportBMarker);

    let reportA = '';
    let reportB = '';

    if (aMatch && aMatch.index !== undefined) {
      const aStart = rawContent.indexOf('\n', aMatch.index) + 1;
      const aEnd = bMatch && bMatch.index !== undefined ? bMatch.index : rawContent.length;
      reportA = cleanContent(rawContent.substring(aStart, aEnd));
    }

    if (bMatch && bMatch.index !== undefined) {
      const bStart = rawContent.indexOf('\n', bMatch.index) + 1;
      reportB = cleanContent(rawContent.substring(bStart));
    }

    if (!reportA && !reportB) {
      // If markers not found, use raw content as reportA
      reportA = cleanContent(rawContent);
    }

    // Save to database
    await prisma.preSalesSession.update({
      where: { id: params.id },
      data: { fullReport: reportA, actionGuide: reportB },
    });

    return NextResponse.json({ fullReport: reportA, actionGuide: reportB });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '再生失败' }, { status: 500 });
  }
}
