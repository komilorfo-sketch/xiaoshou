# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

销售备战教练（"首战即决战"）—— 面向电气制造行业的 B2B 复杂销售 AI 策略引擎。系统通过 7 步状态机驱动 AI 深度追问，强制一线销售完成高质量情报梳理与策略收敛，消除经验盲区。

## 常用命令

```bash
npm run dev          # 启动 Next.js 开发服务器 (端口 3003)
npm run build        # 生产构建
npm run lint         # ESLint 检查
npx prisma db push   # 同步 Prisma schema 到数据库
npx prisma studio    # 打开数据库可视化界面
npx tsx seed.ts      # 运行种子脚本（创建测试用户 顾铮/123456）
streamlit run app.py --server.port 8501  # 启动 Streamlit 采集端（独立应用）
```

## 架构

### 双状态机核心

1. **备战流程（7 步）**：商机溯源 → 盘子与购买力 → 决策链与内线 → 痛点与武器映射 → 同行案例与背书 → 售前专家资源匹配 → 价格策略与合同
   - 每步至少 2 轮深度对话
   - Node 4/6/7 有硬性业务触发器（产品强制植入、专家路由校验、高压逼单演练）
   - 输出双战术资产：全景报告（fullReport）+ 话术包（actionGuide）

2. **复盘流程（6 步）**：决策链与内线验证 → 业务痛点与隐性诉求 → 方案效力与专家势能 → 案例背书与异议洞察 → 商务博弈与底线防守 → 推进承诺与下一步
   - 拉取备战数据做"问责对账"
   - 双评分：准确度（accuracyScore）+ 执行度（adherenceScore）
   - 输出：落差诊断书（diagnosticLetter）+ 战术补救指令（nextStepInstructions）

### 技术栈

- **框架**: Next.js 14 App Router + TypeScript
- **AI**: DeepSeek V4 Pro（通过 OpenAI 兼容 SDK），Vercel AI SDK（useChat / OpenAIStream / StreamingTextResponse）
- **数据库**: SQLite + Prisma ORM（checklistData/chatHistory 以 JSON 字符串存储）
- **UI**: Shadcn/UI base-nova 风格（混合 @base-ui/react + @radix-ui），Tailwind CSS dark mode
- **认证**: bcryptjs 密码哈希，localStorage 存储用户状态（无 JWT，local-first 设计）

### 关键文件

| 文件 | 职责 |
|------|------|
| `src/app/api/chat/route.ts` | 备战对话 API（流式），含 14 专家库 + 7 步状态机系统提示词 |
| `src/app/api/review/route.ts` | 复盘对话 API（流式），拉取备战数据做问责对账 |
| `src/components/ChatInterface.tsx` | 备战对话 UI，解析 AI 标记（`[ITEM_CONFIRMED]`、`[THOUGHTS]` 等） |
| `src/components/RadarBoard.tsx` | 7 步清单侧边栏，红绿灯状态指示 |
| `src/components/ReviewChatInterface.tsx` | 复盘对话 UI |
| `src/components/ReviewRadarBoard.tsx` | 6 步复盘清单侧边栏 |
| `src/components/ReviewSummary.tsx` | 复盘结果展示（诊断书 + 补救指令） |
| `src/lib/db.ts` | Prisma 客户端单例 |

### AI 标记协议

备战对话标记：`[THOUGHTS]`、`[ITEM_CONFIRMED]`、`[ITEM_QUALITY]`、`[ITEM_PROGRESS]`、`[SESSION_TITLE]`、`[SESSION_COMPLETE]`

复盘对话标记：`[ITEM_CONFIRMED]`、`[SUMMARY]`、`[QUALITY]`、`[ACCURACY_SCORE]`、`[ADHERENCE_SCORE]`、`[SESSION_COMPLETE]`

修改系统提示词或前端解析逻辑时，两侧标记必须同步。

### 环境变量

- `DATABASE_URL`：SQLite 连接串（.env）
- `OPENAI_API_KEY`：DeepSeek API Key（.env.local）

### app.py 说明

`app.py` 是独立的 Streamlit 照片采集工具（阿里百炼 qwen-vl-max 视觉模型），与 Next.js 主应用无关联。
