flowchart TD
  A[User opens app] --> B{Authenticated?}
  B -->|No| C[Show sign in page]
  B -->|Yes| D[Dashboard]
  D --> E[Select Chat feature]
  E --> F[Render assistant UI]
  F --> G[Call api chat route]
  G --> H{Invoke AI SDK}
  H --> I[Stream response]
  I --> J[Render response in UI]
  J --> K[Save messages to database]
  K --> L[Update chat history display]