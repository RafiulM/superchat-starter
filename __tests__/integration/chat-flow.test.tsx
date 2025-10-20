import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatPage from '@/app/dashboard/chat/page'

// Mock fetch for integration tests
const mockFetch = global.fetch as jest.Mock

describe('Chat Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default fetch mocks
    mockFetch
      .mockImplementation((url: string) => {
        if (url === '/api/chat') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              conversations: []
            })
          })
        }
        return Promise.reject(new Error(`Unexpected URL: ${url}`))
      })
  })

  describe('Complete Chat Flow', () => {
    it('should handle full conversation flow from creation to message exchange', async () => {
      const user = userEvent.setup()
      
      // Mock conversations list
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/chat' && !options?.method) {
          // GET /api/chat - return conversations list
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ conversations: [] })
          })
        }
        
        if (url === '/api/chat' && options?.method === 'POST') {
          // POST /api/chat - handle message sending
          const body = JSON.parse(options.body as string)
          
          // Mock streaming response
          const stream = new ReadableStream({
            start(controller) {
              // Send some mock streaming data
              const data = '0: {"type": "text-delta", "textDelta": "Hello"}\n'
              controller.enqueue(new TextEncoder().encode(data))
              
              setTimeout(() => {
                const moreData = '0: {"type": "text-delta", "textDelta": " there!"}\n'
                controller.enqueue(new TextEncoder().encode(moreData))
                controller.close()
              }, 100)
            }
          })
          
          return Promise.resolve({
            ok: true,
            body: stream
          })
        }
        
        return Promise.reject(new Error(`Unexpected URL: ${url}`))
      })

      render(<ChatPage />)

      // 1. Verify initial state
      expect(screen.getByText('New Conversation')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()

      // 2. Type and send a message
      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg[data-lucide="send"]')
      )!

      await user.type(messageInput, 'Hello, AI!')
      await user.click(sendButton)

      // 3. Verify message sending initiated
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Hello, AI!')
        }))
      })
    })

    it('should handle conversation history loading', async () => {
      // Mock conversation with history
      mockFetch.mockImplementation((url: string) => {
        if (url === '/api/chat?conversationId=test-conv-123') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              conversation: {
                id: 'test-conv-123',
                title: 'Test Conversation',
                model: 'gpt-4',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              messages: [
                {
                  id: 'msg-1',
                  role: 'user',
                  content: 'Hello',
                  createdAt: new Date().toISOString(),
                },
                {
                  id: 'msg-2',
                  role: 'assistant',
                  content: 'Hi there!',
                  createdAt: new Date().toISOString(),
                }
              ]
            })
          })
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ conversations: [] })
        })
      })

      // Mock URLSearchParams to return conversationId
      const { useSearchParams } = require('next/navigation')
      jest.spyOn(require('next/navigation'), 'useSearchParams').mockReturnValue(
        new URLSearchParams('conversationId=test-conv-123')
      )

      render(<ChatPage />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat?conversationId=test-conv-123')
      })
    })

    it('should handle model selection and persistence', async () => {
      const user = userEvent.setup()
      
      render(<ChatPage />)

      // Find and click model selector
      const modelSelector = screen.getByRole('combobox')
      await user.click(modelSelector)

      // Select GPT-4 Turbo
      const gpt4TurboOption = screen.getByText('GPT-4 Turbo')
      await user.click(gpt4TurboOption)

      // Type and send message to verify model is used
      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg[data-lucide="send"]')
      )!

      await user.type(messageInput, 'Test message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"model":"gpt-4-turbo"')
        }))
      })
    })

    it('should handle file attachments', async () => {
      const user = userEvent.setup()
      
      render(<ChatPage />)

      // Find file attachment button
      const fileInput = screen.getByRole('button').find(btn => 
        btn.querySelector('svg[data-lucide="paperclip"]')
      )!

      // Create a mock file
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      
      // Mock the file input
      const fileInputHidden = document.createElement('input')
      fileInputHidden.type = 'file'
      fileInputHidden.files = [file]
      
      // Simulate file selection
      Object.defineProperty(fileInputHidden, 'files', {
        value: [file],
        writable: false,
      })

      // Type message and send with attachment
      const messageInput = screen.getByPlaceholderText('Type your message...')
      await user.type(messageInput, 'Message with file')

      const sendButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg[data-lucide="send"]')
      )!

      await user.click(sendButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Message with file')
        }))
      })
    })

    it('should handle error states gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network connection failed'))

      render(<ChatPage />)

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg[data-lucide="send"]')
      )!

      await user.type(messageInput, 'Test message')
      await user.click(sendButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to send message')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Streaming', () => {
    it('should handle streaming response correctly', async () => {
      const user = userEvent.setup()
      
      // Mock streaming response with realistic data
      mockFetch.mockImplementation((url: string, options?: RequestInit) => {
        if (url === '/api/chat' && options?.method === 'POST') {
          const stream = new ReadableStream({
            start(controller) {
              // Simulate realistic streaming response
              const chunks = [
                '0: {"type": "text-delta", "textDelta": "I"}\n',
                '0: {"type": "text-delta", "textDelta": " can"}\n',
                '0: {"type": "text-delta", "textDelta": " help"}\n',
                '0: {"type": "text-delta", "textDelta": " you"}\n',
                '0: {"type": "text-delta", "textDelta": " with"}\n',
                '0: {"type": "text-delta", "textDelta": " that!"}\n',
              ]
              
              let index = 0
              const interval = setInterval(() => {
                if (index < chunks.length) {
                  controller.enqueue(new TextEncoder().encode(chunks[index]))
                  index++
                } else {
                  clearInterval(interval)
                  controller.close()
                }
              }, 50)
            }
          })
          
          return Promise.resolve({
            ok: true,
            body: stream
          })
        }
        
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ conversations: [] })
        })
      })

      render(<ChatPage />)

      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg[data-lucide="send"]')
      )!

      await user.type(messageInput, 'Help me')
      await user.click(sendButton)

      // Verify streaming request was made
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
          method: 'POST'
        }))
      })
    })
  })
})