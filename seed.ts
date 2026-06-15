import prisma from './src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  // 1. Create admin user
  const adminHashedPassword = await bcrypt.hash('666888', 10);
  await prisma.user.upsert({
    where: { email: 'admin@system' },
    update: {},
    create: {
      email: 'admin@system',
      employeeId: 'admin',
      name: '系统管理员',
      password: adminHashedPassword,
      isAdmin: true,
    },
  });

  // 2. Create a lead user if not exists
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'guzheng@company.com' },
    update: {},
    create: {
      email: 'guzheng@company.com',
      employeeId: 'GZ001',
      name: '顾铮',
      password: hashedPassword,
    },
  });

  // 2. Create a mock session
  await prisma.preSalesSession.create({
    data: {
      title: '某某成套设备厂 - SIM 系统首战推演',
      userId: user.id,
      isCompleted: true,
      fullReport: `## 🏆 某某成套厂全景备战报告
**时间**：2026-04-10  |  **带队专家**：顾铮

### 1. 战报核心总结
该客户目前正处于新能源大单的交付压力期，痛点极度清晰。核心痛点在于跨部门协同效率低下，导致物料供应与装配节奏脱节。

### 2. 实战清单达成情况
*   **🟢 商机溯源**：老李背书，信任基础稳固。
*   **🟢 痛点映射**：主推武器【SIM即时管理系统】。
*   **🟡 价格策略**：待定，预计首年采取“工具费+服务费”模式。

### 3. 后续攻击计划
周二见面重点演示“事不过夜”看板，当场锁定试点区域。`,
      actionGuide: `## 🔪 现场交流建议与话术 (SPIN 框架)

### 第一阶段：破冰与引导 (Situation)
- **话术**：“王总，我听说咱们最近接了新能源那个大标，这可是行业里的标杆。但这产能爬坡的压力，估计让您各部门最近没少扯皮吧？”

### 第二阶段：痛点深挖 (Problem & Implication)
- **话术**：“如果按照现在的协同方式，如果这种‘救火式’管理不改掉，咱们这批大单的按时交付率能到 80% 吗？这罚金和品牌损失，咱们算过吗？”

### 第三阶段：武器切入 (Need-Payoff)
- **建议主攻**：【SIM系统】。
- **金句**：“我们这套系统不是软件，而是‘数字化特遣队’。两周上线，当月见效。我们的目标是把您从‘救火’中解放出来，去想更高级的战略。”`,
      checklistData: JSON.stringify({ node1: 'green', node2: 'green', node3: 'green', node4: 'green', node5: 'green', node6: 'green', node7: 'green' })
    }
  });

  console.log('✅ 数据预置成功！');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
