import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import ChatPage from '@/app/dashboard/chat/page'

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}))

jest.mock('@/app/dashboard/chat/page', () => {
  const originalModule = jest.requireActual('@/app/dashboard/chat/page')
  return {
    ...originalModule,
    __esModule: true,
    default: function ChatPage() {
      return originalModule.default()
    },
  }
})

// Mock fetch
global.fetch = jest.fn()

describe('Chat Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders chat interface', () => {
    render(<ChatPage />)
    
    expect(screen.getByText('New Conversation')).toBeInTheDocument()
    expect(screen.getByText('AI Chat')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('shows new conversation button', () => {
    render(<ChatPage />)
    
    const newConversationBtn = screen.getByText('New Conversation')
    expect(newConversationBtn).toBeInTheDocument()
  })

  it('has model selector', () => {
    render(<ChatPage />)
    
    expect(screen.getByText('Model:')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('has input field and send button', () => {
    render(<ChatPage />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: '' }) // Send icon button
    
    expect(input).toBeInTheDocument()
    expect(sendButton).toBeInTheDocument()
  })

  it('shows attachment buttons', () => {
    render(<ChatPage />)
    
    // Check for paperclip and image buttons (they have icon-only labels)
    const attachmentButtons = screen.getAllByRole('button')
    expect(attachmentButtons.length).toBeGreaterThan(2) // At least new conversation, attachments, send
  })

  describe('Message Sending', () => {
    it('enables send button when there is text input', async () => {
      render(<ChatPage />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button').filter(btn => 
        btn.querySelector('svg') && !btn.textContent
      ).pop() // Get the last button (send button)

      expect(sendButton).toBeDisabled()
      
      fireEvent.change(input, { target: { value: 'Hello world' } })
      
      await waitFor(() => {
        expect(sendButton).not.toBeDisabled()
      })
    })

    it('shows error toast when message sending fails', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<ChatPage />)
      
      const input = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button').filter(btn => 
        btn.querySelector('svg') && !btn.textContent
      ).pop()

      fireEvent.change(input, { target: { value: 'Hello world' } })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to send message')
      })
    })
  })

  describe('Model Selection', () => {
    it('shows available models', () => {
      render(<ChatPage />)
      
      const modelSelector = screen.getByRole('combobox')
      fireEvent.click(modelSelector)
      
      // The dropdown should appear with model options
      expect(screen.getByText('GPT-3.5 Turbo')).toBeInTheDocument()
      expect(screen.getByText('GPT-4')).toBeInTheDocument()
      expect(screen.getByText('GPT-4 Turbo')).toBeInTheDocument()
      expect(screen.getByText('GPT-4o')).toBeInTheDocument()
    })
  })

  describe('Conversation Loading', () => {
    it('loads conversations on mount', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          conversations: [
            {
              id: 'conv-1',
              title: 'Test Conversation',
              model: 'gpt-4',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          ]
        })
      })

      render(<ChatPage />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/chat')
      })
    })

    it('shows error toast when conversation loading fails', async () => {
      const mockFetch = global.fetch as jest.Mock
      mockFetch.mockRejectedValue(new Error('Network error'))

      render(<ChatPage />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load conversations')
      })
    })
  })
})