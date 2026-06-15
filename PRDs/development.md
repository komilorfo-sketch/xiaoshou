技术架构与开发实现文档：《销售备战教练：首战即决战》
文档版本： V 3.0 (Local-First 开源极速版)
核心约束： 100% 数据本地化部署、100% 采用成熟开源库、强制使用 Shadcn/UI + Tailwind 缩减代码量并提升稳定性。
一、 系统架构蓝图 (Local-First 拓扑)
整个系统分为三层，全部部署在企业内网或本地开发机上，确保客户极度敏感的售前商业情报、合同底价等数据物理隔离，绝不流向公网。
表现层 & 业务网关 (Web App)： 基于 Next.js 14 (App Router) 的全栈架构。前端承载“左右双栏”交互，API Routes 承载状态机校验与大模型路由。
本地 AI 推理层 (Local LLM)： 通过 Ollama 或 vLLM 本地部署开源大模型（推荐 Qwen2.5:14b-instruct 或 DeepSeek-R1-Distill，兼顾消费级显卡算力与强逻辑推理）。
持久化层 (Database)： 使用本地 Docker 部署的 PostgreSQL，结合 Prisma ORM，利用 JSONB 字段灵活存储 7 项检查清单的状态。
二、 核心技术栈与“不造轮子”组件清单
⚠️ 研发约束： 必须使用以下列表中的 npm 包，严禁手搓样式、对话流控和状态管理逻辑。
1. 前端视觉与交互 (重型约束)
核心框架： Next.js 14 + React 18。
样式引擎： Tailwind CSS (强制使用，AI 生成 UI 的唯一基准)。
UI 组件库： shadcn/ui (强制使用)。
按需引入命令： npx shadcn-ui@latest add button card input scroll-area badge tabs dialog
优势： 代码直接注入项目，高度可定制，自带 B2B 的冷峻高级感，大幅节省 AI 生成 UI 时的 Token 消耗和试错成本。
图标库： lucide-react。
2. 对话引擎与流式渲染 (AI 中枢)
全栈 AI SDK： ai (Vercel AI SDK)。
核心价值： 直接使用其 useChat Hook 解决对话状态管理、流式文本拼接 (Streaming)、加载状态 (Loading) 切换等所有复杂逻辑。
本地大模型通信： @ai-sdk/openai。
本地化适配策略： Ollama 提供了完全兼容 OpenAI 的本地 API 接口。只需在代码中配置 baseURL: 'http://localhost:11434/v1'，即可用最成熟的 OpenAI SDK 零成本对接本地模型。
富文本与表格渲染： react-markdown + remark-gfm (用于渲染 AI 生成的最终报告和话术)。
3. 状态管理与数据持久化
前端状态管理： Zustand。
职责： 极度轻量，专门用于维护那“7 项清单”的实时红绿灯状态 (Node 1 到 Node 7)，以及当前进行到的步骤索引。严禁引入繁重的 Redux。
数据库 ORM： Prisma。提供强类型约束，AI 写增删改查代码零 Bug。
三、 核心数据模型 (Prisma Schema)
采用极简的表结构设计，将复杂的业务逻辑（7 项清单的深挖细节）下放到 PostgreSQL 的 JSONB 字段中处理，避免频繁修改数据库结构。

代码段


// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // 指向本地 PostgreSQL 容器
}

model PreSalesSession {
  id             String   @id @default(uuid())
  title          String   @default("未命名备战任务")
  
  // 核心：使用 JSONB 存储 7 项实战清单的达成状态与具体内容
  // 结构示例: { node1: { status: 'green', content: '...' }, node2: ... }
  checklistData  Json     @default("{}") 
  
  // 核心：存储最终生成的两份战术资产
  fullReport     String?  @db.Text // 销售备战全景报告
  actionGuide    String?  @db.Text // 现场交流建议及场景话术
  
  isCompleted    Boolean  @default(false)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}


四、 给 AI IDE (Trae / Cursor) 的极速启动指令
当你准备开始写代码时，请在 AI IDE 中新建一个空目录，开启 Composer / Builder 模式，并直接发送以下完整 Prompt：
角色设定： 你是顶尖的全栈架构师。我们需要开发一款 100% 本地化部署的 B2B 售前 AI 教练 SaaS。
技术栈强制要求： Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand, Vercel AI SDK (ai 包), Prisma。大模型端点将指向本地 Ollama (http://localhost:11434/v1)。
初始化与核心开发任务：
请给出完整的终端命令序列，初始化 Next.js 项目并安装上述所有依赖（包括 shadcn/ui 的 card, button, input, scroll-area, badge）。
前端布局构建 (app/workspace/page.tsx)： > * 实现左右双栏布局。左侧 w-1/3 为“战术雷达看板”，纵向列出 7 项备战清单，右侧配有状态指示灯（默认为灰色，完成变绿）。
右侧 w-2/3 为基于 useChat 的 AI 工作区，包含消息流和底部输入框。
状态机引擎 (store/useChecklistStore.ts)：
使用 Zustand 创建全局状态，维护 currentNode (当前推进到第几项，1-7) 和 checklistStatus (每项的具体状态和数据)。
AI 通信路由 (app/api/chat/route.ts)：
使用 @ai-sdk/openai，配置 baseURL 指向本地 Ollama 端口。
使用 streamText 返回流式响应。注意： 我稍后会将详细的业务 System Prompt 给你，你现在先搭好通信管道即可。