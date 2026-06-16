import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        password: true,
        isAdmin: true,
        createdAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ message: '获取用户列表失败', error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, name, email, employeeId, password } = await req.json();
    if (!id) {
      return NextResponse.json({ message: '缺少用户ID' }, { status: 400 });
    }

    const data: Record<string, string> = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (employeeId !== undefined) data.employeeId = employeeId;
    if (password) data.password = password;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: '没有要更新的字段' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        password: true,
        isAdmin: true,
        createdAt: true,
      },
    });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: '更新用户失败', error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: '缺少用户ID' }, { status: 400 });
    }

    await prisma.preSalesSession.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: '删除成功' });
  } catch (error: any) {
    return NextResponse.json({ message: '删除用户失败', error: error.message }, { status: 500 });
  }
}
