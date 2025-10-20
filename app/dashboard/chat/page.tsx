'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Send, Plus, Paperclip, Image } from 'lucide-react';
import { AssistantRuntimeProvider, AssistantView, useExternalStoreRuntime } from '@assistant-ui/react';
import { MarkdownText } from '@assistant-ui/react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  attachments?: any;
}

interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

const CHAT_MODELS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
];

function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
    
    const conversationId = searchParams.get('conversationId');
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [searchParams]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/chat');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat?conversationId=${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentConversation(data.conversation);
        setMessages(data.messages || []);
        setSelectedModel(data.conversation.model);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
    }
  };

  const createNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    router.push('/dashboard/chat');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const sendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    setIsLoading(true);
    const messageContent = input.trim();
    setInput('');

    // Create a temporary user message for immediate display
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempUserMessage]);

    try {
      // Prepare attachments
      const attachments = attachedFiles.map(file => ({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: file.size,
        // In a real implementation, you'd upload the file and get a URL
        url: URL.createObjectURL(file),
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: currentConversation?.id,
          message: {
            content: messageContent,
          },
          model: selectedModel,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Remove the temporary message and replace with real messages
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponseContent = '';

      if (reader) {
        const tempAiMessage: Message = {
          id: `temp-ai-${Date.now()}`,
          role: 'assistant',
          content: '',
          createdAt: new Date().toISOString(),
        };

        setMessages(prev => [...prev, tempAiMessage]);

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
                  
                  // Update the temporary AI message
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === tempAiMessage.id 
                        ? { ...msg, content: aiResponseContent }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Ignore JSON parse errors
              }
            }
          }
        }
      }

      // Reload conversations to get the latest
      await loadConversations();

      // If this was a new conversation, get the conversation details
      if (!currentConversation) {
        await loadConversations();
        const updatedConvs = await fetch('/api/chat').then(r => r.json());
        if (updatedConvs.conversations.length > 0) {
          const latestConv = updatedConvs.conversations[0];
          setCurrentConversation(latestConv);
          router.push(`/dashboard/chat?conversationId=${latestConv.id}`);
        }
      }

      // Clear attachments
      setAttachedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Remove the temporary message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempUserMessage.id));
      
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const runtime = useExternalStoreRuntime({
    messages: messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: [{ type: 'text', text: msg.content }],
    })),
    onNew: (msg) => {
      // This is handled by the streaming logic above
    },
    transforms: {
      text: ({ parts }) => {
        return <MarkdownText>{parts.map(p => p.text).join('')}</MarkdownText>;
      },
    },
  });

  return (
    <div className="flex h-full">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b">
          <Button
            onClick={createNewConversation}
            className="w-full"
            variant="default"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  currentConversation?.id === conversation.id ? 'bg-muted' : ''
                }`}
                onClick={() => {
                  router.push(`/dashboard/chat?conversationId=${conversation.id}`);
                  loadConversation(conversation.id);
                }}
              >
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">
                    {conversation.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {conversation.model} • {new Date(conversation.updatedAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 bg-background">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <h1 className="text-xl font-semibold">
              {currentConversation?.title || 'New Conversation'}
            </h1>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Model:</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAT_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-4">
          <AssistantRuntimeProvider runtime={runtime}>
            <AssistantView />
          </AssistantRuntimeProvider>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Attachments */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-muted rounded-md p-2 text-sm"
                  >
                    {file.type.startsWith('image/') ? (
                      <Image className="w-4 h-4" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-32">{file.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAttachment(index)}
                      className="h-4 w-4 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Controls */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="min-h-10"
                />
              </div>
              
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <Image className="w-4 h-4" />
                </Button>
                
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || (!input.trim() && attachedFiles.length === 0)}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <ChatInterface />;
}