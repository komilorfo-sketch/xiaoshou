import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, email, employeeId, password } = await req.json();

    if (!name || !email || !employeeId || !password) {
      return NextResponse.json(
        { message: '所有字段均为必填项' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { employeeId: employeeId }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: '邮箱或工号已被注册' },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        employeeId,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: '注册成功', userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: '注册失败，请稍后重试', error: error.message },
      { status: 500 }
    );
  }
}
