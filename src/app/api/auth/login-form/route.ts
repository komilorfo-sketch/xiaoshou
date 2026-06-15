import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      return NextResponse.redirect(new URL('/login?error=missing', req.url), 303);
    }

    // Vercel 部署万能测试账号（无需数据库）
    if (email === 'admin' && password === '123456') {
      const userData = JSON.stringify({
        id: 'admin-mock',
        name: '管理员',
        email: 'admin@shouqian3.local',
        isAdmin: true,
      });
      const response = NextResponse.redirect(new URL('/workspace', req.url), 303);
      response.cookies.set('user', userData, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return response;
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
      return NextResponse.redirect(new URL('/login?error=notfound', req.url), 303);
    }

    if (password !== user.password) {
      return NextResponse.redirect(new URL('/login?error=wrongpassword', req.url), 303);
    }

    const userData = JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });

    const response = NextResponse.redirect(new URL('/workspace', req.url), 303);
    response.cookies.set('user', userData, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login form error:', error);
    return NextResponse.redirect(new URL('/login?error=server', req.url), 303);
  }
}
