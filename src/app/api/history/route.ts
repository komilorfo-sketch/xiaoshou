import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'completed' or 'draft'
    const userId = searchParams.get('userId');
    
    if (!userId && type !== 'shared') {
      return NextResponse.json({ message: 'Missing userId' }, { status: 400 });
    }

    const sessions = await prisma.preSalesSession.findMany({
      where: {
        ...(type === 'shared' ? { isShared: true } : { userId: userId }),
        ...(type === 'completed' ? { isCompleted: true } :
           type === 'draft' ? { isCompleted: false } :
           type === 'review-draft' ? { isCompleted: true, isReviewed: false, reviewChatHistory: { not: "[]" } } : {})
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          }
        }
      }
    });

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('Fetch history error:', error);
    return NextResponse.json(
      { message: '获取历史记录失败', error: error.message },
      { status: 500 }
    );
  }
}

// Optional: POST to create a mock record for testing if empty
export async function POST(req: Request) {
    try {
        const { userId, title, fullReport, actionGuide, checklistData, chatHistory, isCompleted } = await req.json();
        
        const session = await prisma.preSalesSession.create({
            data: {
                title: title || "未命名备战任务",
                fullReport,
                actionGuide,
                userId,
                isCompleted: isCompleted ?? false,
                checklistData: JSON.stringify(checklistData || {}),
                chatHistory: JSON.stringify(chatHistory || [])
            }
        });
        
        return NextResponse.json(session);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
