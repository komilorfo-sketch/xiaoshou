import prisma from './src/lib/db';

async function main() {
  // 管理员账号
  await prisma.user.upsert({
    where: { email: 'admin@local' },
    update: { password: '1' },
    create: {
      email: 'admin@local',
      employeeId: 'admin',
      name: '管理员',
      password: '1',
      isAdmin: true,
    },
  });

  // 普通用户
  const user = await prisma.user.upsert({
    where: { email: 'li@local' },
    update: { password: '1' },
    create: {
      email: 'li@local',
      employeeId: 'li',
      name: 'li',
      password: '1',
    },
  });

  console.log('✅ 种子数据就绪：admin/1, li/1');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
