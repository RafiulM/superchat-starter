const { configure } = require('@testing-library/jest-dom')

// Configure testing-library
configure({ testIdAttribute: 'data-testid' })

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <img {...props} />,
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, ...props }) => <a {...props}>{children}</a>,
}))