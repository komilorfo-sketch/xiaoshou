# 共享库功能设计

## 概述

在历史库中为每条已完成备战增加「分享」按钮，用户点击后将其推送到共享库。共享库页面布局与历史库一致，展示所有用户分享的备战记录，所有登录用户可见。

## 数据模型

无需变更。`PreSalesSession` 已有 `isShared: Boolean @default(false)` 字段。

## API 变更

### `/api/history` GET

增加 `type=shared` 分支：

```
type=shared → where: { isShared: true }  // 不限 userId
```

已有 `include: { user: { select: { name: true } } }`，共享库中可显示分享人姓名。

### `/api/sessions/[id]` PATCH

已支持 `isShared` 字段更新，无需改动。

## 前端变更

### 1. 历史库页面 `/history`

- 每条备战卡片增加「分享」按钮（Share2 图标）
- 点击调用 `PATCH /api/sessions/{id}` 设置 `isShared=true`，toast 提示「已分享到共享库」
- 已分享的显示「已分享」标签，可点击取消分享（`isShared=false`）
- 分享状态切换后刷新本地 sessions 数据

### 2. 共享库页面 `/shared`（新建）

- 布局与历史库完全一致：左侧 30% 列表 + 右侧 70% 详情
- 数据源：`/api/history?type=shared`（不限用户）
- 每条卡片显示分享人姓名（session.user.name）
- 右侧详情：三 Tab（销售备战报告 / 交流建议话术 / 事后总结复盘），只读浏览
- 无操作按钮（不显示「开始复盘」「编辑」等）

### 3. 导航栏 `MainHeader`

- 共享库按钮链接到 `/shared`
- `activePage` 类型增加 `'shared'`
