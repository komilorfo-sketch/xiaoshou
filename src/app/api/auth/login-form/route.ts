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

    type UserRecord = { id: string; name: string; email: string; employeeId: string; password: string; isAdmin: number };
    const results = await prisma.$queryRawUnsafe<UserRecord[]>(
      `SELECT id, name, email, employeeId, password, isAdmin FROM User WHERE email = ? OR employeeId = ? LIMIT 1`,
      email, email
    );

    if (!results || results.length === 0) {
      return NextResponse.redirect(new URL('/login?error=notfound', req.url), 303);
    }

    const user = results[0];
    if (password !== user.password) {
      return NextResponse.redirect(new URL('/login?error=wrongpassword', req.url), 303);
    }

    const userData = JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: Boolean(user.isAdmin),
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
