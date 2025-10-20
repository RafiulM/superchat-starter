import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { conversations, messages } from '@/db/schema/auth';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      conversationId, 
      message: userMessage, 
      model = 'gpt-4',
      attachments 
    } = body;

    if (!userMessage?.content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    let currentConversationId = conversationId;

    // If no conversation ID, create a new conversation
    if (!currentConversationId) {
      const newConversationId = uuidv4();
      const conversationTitle = userMessage.content.slice(0, 50) + 
        (userMessage.content.length > 50 ? '...' : '');

      await db.insert(conversations).values({
        id: newConversationId,
        userId: session.user.id,
        title: conversationTitle,
        model: model,
        metadata: attachments ? JSON.stringify(attachments) : null,
      });

      currentConversationId = newConversationId;
    }

    // Save the user message to the database
    const userMessageId = uuidv4();
    await db.insert(messages).values({
      id: userMessageId,
      conversationId: currentConversationId,
      role: 'user',
      content: userMessage.content,
      attachments: attachments ? JSON.stringify(attachments) : null,
    });

    // Get conversation history for context
    const conversationHistory = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, currentConversationId))
      .orderBy(messages.createdAt);

    // Format messages for AI API
    const formattedMessages = conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Handle attachments if present
    let enhancedContent = userMessage.content;
    if (attachments && Array.isArray(attachments)) {
      const imageAttachments = attachments.filter(a => a.type === 'image');
      if (imageAttachments.length > 0) {
        // For images, we'll add them to the content as structured data
        // In a real implementation, you'd upload images and get URLs
        enhancedContent = `
${userMessage.content}

[Images: ${imageAttachments.length} image(s) attached]
        `.trim();
      }
    }

    // Update the last user message with enhanced content
    await db
      .update(messages)
      .set({ content: enhancedContent })
      .where(eq(messages.id, userMessageId));

    // Stream the AI response
    const result = await streamText({
      model: openai(model),
      messages: formattedMessages,
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Create AI message record initially empty
    const aiMessageId = uuidv4();
    let aiResponseContent = '';

    // Convert the stream to a text stream and save the response
    const stream = result.toDataStreamResponse();
    
    // Create a new stream that captures the content
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const reader = stream.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    // Process the stream and capture AI response
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const data = JSON.parse(line.slice(2));
                if (data.type === 'text-delta') {
                  aiResponseContent += data.textDelta;
                }
              } catch (e) {
                // Ignore JSON parse errors for streaming data
              }
            }
          }

          // Forward the chunk to the client
          await writer.write(encoder.encode(chunk));
        }

        // Save the complete AI response to the database
        if (aiResponseContent) {
          await db.insert(messages).values({
            id: aiMessageId,
            conversationId: currentConversationId,
            role: 'assistant',
            content: aiResponseContent,
          });
        }

        await writer.close();
      } catch (error) {
        console.error('Stream processing error:', error);
        await writer.abort(error);
      }
    })();

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get conversation history
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      // Get all conversations for the user
      const userConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, session.user.id))
        .orderBy(conversations.updatedAt);

      return NextResponse.json({ conversations: userConversations });
    }

    // Get specific conversation with messages
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, session.user.id)
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    return NextResponse.json({
      conversation: conversation[0],
      messages: conversationMessages,
    });

  } catch (error) {
    console.error('Chat GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}