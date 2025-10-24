import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavMain } from './nav-main'

// Mock the tabler icons
jest.mock('@tabler/icons-react', () => ({
  IconCirclePlusFilled: () => <div data-testid="quick-create-icon">QuickCreateIcon</div>,
  IconMail: () => <div data-testid="mail-icon">MailIcon</div>,
  IconSearch: () => <div data-testid="search-icon">SearchIcon</div>,
  IconPhoto: () => <div data-testid="photo-icon">PhotoIcon</div>,
}))

// Mock the sidebar components
jest.mock('@/components/ui/sidebar', () => ({
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-group">{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-group-content">{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu">{children}</div>,
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div data-testid="sidebar-menu-item">{children}</div>,
  SidebarMenuButton: ({ children, ...props }: { children: React.ReactNode } & any) => <button data-testid="sidebar-menu-button" {...props}>{children}</button>,
}))

// Mock the button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void } & any) =>
    <button onClick={onClick} data-testid="button" {...props}>{children}</button>,
}))

const mockItems = [
  { title: 'Dashboard', url: '/dashboard' },
  { title: 'Analytics', url: '/analytics' },
]

describe('NavMain Component', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    // Mock console.log to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders navigation items correctly', () => {
    render(<NavMain items={mockItems} />)

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Quick Create')).toBeInTheDocument()
  })

  it('renders AI Search button with correct accessibility attributes', () => {
    render(<NavMain items={mockItems} />)

    const aiSearchButton = screen.getByLabelText('AI Search')
    expect(aiSearchButton).toBeInTheDocument()
    expect(aiSearchButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('AI Search')).toBeInTheDocument() // sr-only text
  })

  it('renders AI Image Generation button with correct accessibility attributes', () => {
    render(<NavMain items={mockItems} />)

    const aiImageButton = screen.getByLabelText('AI Image Generation')
    expect(aiImageButton).toBeInTheDocument()
    expect(aiImageButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('AI Image Generation')).toBeInTheDocument() // sr-only text
  })

  it('renders Inbox button with correct accessibility attributes', () => {
    render(<NavMain items={mockItems} />)

    const inboxButton = screen.getByLabelText('Inbox')
    expect(inboxButton).toBeInTheDocument()
    expect(screen.getByText('Inbox')).toBeInTheDocument() // sr-only text
  })

  it('handles AI Search button click correctly', async () => {
    render(<NavMain items={mockItems} />)

    const aiSearchButton = screen.getByLabelText('AI Search')
    await user.click(aiSearchButton)

    expect(console.log).toHaveBeenCalledWith('AI Search feature activated')
    expect(aiSearchButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('handles AI Image Generation button click correctly', async () => {
    render(<NavMain items={mockItems} />)

    const aiImageButton = screen.getByLabelText('AI Image Generation')
    await user.click(aiImageButton)

    expect(console.log).toHaveBeenCalledWith('AI Image Generation feature activated')
    expect(aiImageButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('applies active styling when AI Search is clicked', async () => {
    render(<NavMain items={mockItems} />)

    const aiSearchButton = screen.getByLabelText('AI Search')
    expect(aiSearchButton).toHaveClass('outline') // initial state

    await user.click(aiSearchButton)

    // After click, it should have the default variant (active state)
    expect(aiSearchButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('applies active styling when AI Image Generation is clicked', async () => {
    render(<NavMain items={mockItems} />)

    const aiImageButton = screen.getByLabelText('AI Image Generation')
    expect(aiImageButton).toHaveClass('outline') // initial state

    await user.click(aiImageButton)

    // After click, it should have the default variant (active state)
    expect(aiImageButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders with correct icons', () => {
    render(<NavMain items={mockItems} />)

    expect(screen.getByTestId('quick-create-icon')).toBeInTheDocument()
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
    expect(screen.getByTestId('photo-icon')).toBeInTheDocument()
    expect(screen.getByTestId('mail-icon')).toBeInTheDocument()
  })

  it('maintains responsive layout structure', () => {
    render(<NavMain items={mockItems} />)

    // Check that the AI buttons are wrapped in the feature buttons container
    const aiFeatureButtons = document.querySelector('.ai-feature-buttons')
    expect(aiFeatureButtons).toBeInTheDocument()

    // Check that buttons have responsive classes
    const aiSearchButton = screen.getByLabelText('AI Search')
    expect(aiSearchButton).toHaveClass('size-8')
  })

  it('supports keyboard navigation', async () => {
    render(<NavMain items={mockItems} />)

    const aiSearchButton = screen.getByLabelText('AI Search')
    aiSearchButton.focus()
    expect(aiSearchButton).toHaveFocus()

    // Test Enter key activation
    await user.keyboard('{Enter}')
    expect(console.log).toHaveBeenCalledWith('AI Search feature activated')
  })

  it('handles multiple button clicks correctly', async () => {
    render(<NavMain items={mockItems} />)

    const aiSearchButton = screen.getByLabelText('AI Search')
    const aiImageButton = screen.getByLabelText('AI Image Generation')

    // Click AI Search first
    await user.click(aiSearchButton)
    expect(aiSearchButton).toHaveAttribute('aria-pressed', 'true')
    expect(aiImageButton).toHaveAttribute('aria-pressed', 'false')

    // Then click AI Image Generation
    await user.click(aiImageButton)
    expect(aiImageButton).toHaveAttribute('aria-pressed', 'true')
    expect(aiSearchButton).toHaveAttribute('aria-pressed', 'false')
  })
})