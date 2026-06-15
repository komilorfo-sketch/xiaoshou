import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

type UserRecord = { id: string; email: string; employeeId: string; password: string; isAdmin: number; createdAt: string };

export async function GET() {
  try {
    const users = await prisma.$queryRawUnsafe<UserRecord[]>(
      `SELECT id, email, employeeId, isAdmin, createdAt FROM User ORDER BY createdAt DESC`
    );
    const result = users.map(u => ({ ...u, isAdmin: Boolean(u.isAdmin) }));
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: '获取用户列表失败', error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, email, employeeId, password } = await req.json();
    if (!id) {
      return NextResponse.json({ message: '缺少用户ID' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const params: any[] = [];

    if (email !== undefined) { setClauses.push('email = ?'); params.push(email); }
    if (employeeId !== undefined) { setClauses.push('employeeId = ?'); params.push(employeeId); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      setClauses.push('password = ?');
      params.push(hashed);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ message: '没有要更新的字段' }, { status: 400 });
    }

    params.push(id);
    await prisma.$executeRawUnsafe(
      `UPDATE User SET ${setClauses.join(', ')} WHERE id = ?`,
      ...params
    );

    const rows = await prisma.$queryRawUnsafe<UserRecord[]>(
      `SELECT id, email, employeeId, isAdmin, createdAt FROM User WHERE id = ? LIMIT 1`,
      id
    );
    const user = rows[0];
    return NextResponse.json({ ...user, isAdmin: Boolean(user.isAdmin) });
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

    await prisma.$executeRawUnsafe(`DELETE FROM User WHERE id = ?`, id);
    return NextResponse.json({ message: '删除成功' });
  } catch (error: any) {
    return NextResponse.json({ message: '删除用户失败', error: error.message }, { status: 500 });
  }
}
