import { POST, GET } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Mock the auth module
jest.mock('@/lib/auth')
jest.mock('@/db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    where: jest.fn(),
    values: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
  },
}))

jest.mock('@/db/schema/auth', () => ({
  conversations: {},
  messages: {},
}))

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-1234',
}))

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(() => ({
    model: 'gpt-4',
  })),
}))

jest.mock('ai', () => ({
  streamText: jest.fn(),
}))

describe('/api/chat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/chat', () => {
    it('should return 401 when user is not authenticated', async () => {
      ;(auth.api.getSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: { content: 'Hello' },
          model: 'gpt-4',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
      
      const body = await response.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('should return 400 when message content is missing', async () => {
      const mockSession = {
        user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
      }
      ;(auth.api.getSession as jest.Mock).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: { content: '' },
          model: 'gpt-4',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
      
      const body = await response.json()
      expect(body).toEqual({ error: 'Message content is required' })
    })

    it('should create a new conversation when no conversationId is provided', async () => {
      const mockSession = {
        user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
      }
      ;(auth.api.getSession as jest.Mock).mockResolvedValue(mockSession)

      const { db } = require('@/db')
      const mockInsert = {
        values: jest.fn().mockResolvedValue(undefined),
      }
      db.insert.mockReturnValue(mockInsert)

      const { streamText } = require('ai')
      const mockStreamTextResponse = {
        toDataStreamResponse: jest.fn().mockReturnValue(
          new Response('mock streaming response')
        ),
      }
      streamText.mockResolvedValue(mockStreamTextResponse)

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: { content: 'Hello, world!' },
          model: 'gpt-4',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
      
      // Verify that conversation was created
      expect(db.insert).toHaveBeenCalledWith(expect.any(Object))
      expect(mockInsert.values).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'mock-uuid-1234',
          userId: 'user-123',
          title: 'Hello, world!',
          model: 'gpt-4',
        })
      )
    })
  })

  describe('GET /api/chat', () => {
    it('should return 401 when user is not authenticated', async () => {
      ;(auth.api.getSession as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/chat')
      const response = await GET(request)
      
      expect(response.status).toBe(401)
      
      const body = await response.json()
      expect(body).toEqual({ error: 'Unauthorized' })
    })

    it('should return conversations list when no conversationId is provided', async () => {
      const mockSession = {
        user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
      }
      ;(auth.api.getSession as jest.Mock).mockResolvedValue(mockSession)

      const { db } = require('@/db')
      const mockConversations = [
        {
          id: 'conv-1',
          title: 'Test Conversation',
          model: 'gpt-4',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
      
      const mockSelect = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockConversations),
      }
      db.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/chat')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      
      const body = await response.json()
      expect(body).toEqual({ conversations: mockConversations })
    })

    it('should return 404 when conversation is not found', async () => {
      const mockSession = {
        user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
      }
      ;(auth.api.getSession as jest.Mock).mockResolvedValue(mockSession)

      const { db } = require('@/db')
      const mockSelect = {
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      }
      db.select.mockReturnValue(mockSelect)

      const request = new NextRequest('http://localhost:3000/api/chat?conversationId=nonexistent')
      const response = await GET(request)
      
      expect(response.status).toBe(404)
      
      const body = await response.json()
      expect(body).toEqual({ error: 'Conversation not found' })
    })
  })
})