import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await prisma.preSalesSession.findUnique({
      where: { id: params.id },
    });

    if (!session) {
      return NextResponse.json({ message: '会话不存在' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    
    // Prepare update data
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.checklistData !== undefined) updateData.checklistData = JSON.stringify(data.checklistData);
    if (data.chatHistory !== undefined) updateData.chatHistory = JSON.stringify(data.chatHistory);
    if (data.isCompleted !== undefined) updateData.isCompleted = data.isCompleted;
    if (data.fullReport !== undefined) updateData.fullReport = data.fullReport;
    if (data.actionGuide !== undefined) updateData.actionGuide = data.actionGuide;
    if (data.currentStep !== undefined) updateData.currentStep = data.currentStep;

    // AAR Fields
    if (data.isReviewed !== undefined) updateData.isReviewed = data.isReviewed;
    if (data.reviewChecklistData !== undefined) updateData.reviewChecklistData = typeof data.reviewChecklistData === 'string' ? data.reviewChecklistData : JSON.stringify(data.reviewChecklistData);
    if (data.reviewChatHistory !== undefined) updateData.reviewChatHistory = typeof data.reviewChatHistory === 'string' ? data.reviewChatHistory : JSON.stringify(data.reviewChatHistory);
    if (data.diagnosticLetter !== undefined) updateData.diagnosticLetter = data.diagnosticLetter;
    if (data.nextStepInstructions !== undefined) updateData.nextStepInstructions = data.nextStepInstructions;
    if (data.accuracyScore !== undefined) updateData.accuracyScore = data.accuracyScore;
    if (data.adherenceScore !== undefined) updateData.adherenceScore = data.adherenceScore;
    if (data.isShared !== undefined) updateData.isShared = data.isShared;

    const session = await prisma.preSalesSession.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.preSalesSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: '删除成功' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
