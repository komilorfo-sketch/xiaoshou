import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: '邮箱和密码均为必填项' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { employeeId: email }
        ]
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 401 }
      );
    }

    if (password !== user.password) {
      return NextResponse.json(
        { message: '密码错误' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: '登录成功',
      user: { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
    }, { status: 200 });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: '登录失败，请稍后重试', error: error.message },
      { status: 500 }
    );
  }
}
