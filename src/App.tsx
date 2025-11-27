import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import type { Message, StreamEvent } from './types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidBlock } from './components/MermaidBlock';
import './index.css';

function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chat_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('dify_config');
    return saved ? JSON.parse(saved) : { url: '', key: '' };
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Load config from local storage
    const savedConfig = localStorage.getItem('dify_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    // Load messages from local storage
    const savedMessages = localStorage.getItem('chat_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  // Save config to local storage
  useEffect(() => {
    localStorage.setItem('dify_config', JSON.stringify(config));
  }, [config]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = document.querySelector('.messages-area');
    if (container) {
      if (behavior === 'auto') {
        container.scrollTop = container.scrollHeight;
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior });
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) return;

    // If it's a new user message, always smooth scroll
    if (lastMessage.role === 'user') {
      scrollToBottom('smooth');
      return;
    }

    // For assistant messages (streaming)
    if (lastMessage.role === 'assistant') {
      // Check if user is near bottom (within 100px)
      const container = document.querySelector('.messages-area');
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        // Only auto-scroll if user is already reading at the bottom
        if (isNearBottom) {
          // Use 'auto' (instant) scroll for streaming to prevent jitter
          scrollToBottom('auto');
        }
      } else {
        // Fallback if container not found
        scrollToBottom('auto');
      }
    }
  }, [messages]);

  // Auto-resize textarea
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create a placeholder for the assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const isStaticBuild = import.meta.env.VITE_IS_STATIC_BUILD === 'true';
      const envUrl = import.meta.env.DIFY_API_URL;
      const envKey = import.meta.env.DIFY_API_KEY;

      // Determine effective URL and Key
      // Priority: User Config > Env Vars
      const effectiveUrl = config.url || envUrl;
      const effectiveKey = config.key || envKey;

      if (!effectiveKey) {
        throw new Error('Please configure Dify API Key in Settings.');
      }

      let fetchUrl = '';
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (isStaticBuild) {
        // Direct Mode (GitHub Pages)
        if (!effectiveUrl) throw new Error('Please configure Dify API URL in Settings.');
        fetchUrl = `${effectiveUrl}/chat-messages`;
        headers['Authorization'] = `Bearer ${effectiveKey}`;
      } else {
        // Proxy Mode (Local/Vercel)
        fetchUrl = '/api/chat-messages';
        // Pass overrides via headers if they exist and differ from env (or just always pass if user configured)
        if (config.url) headers['X-Dify-Url'] = config.url;
        if (config.key) headers['Authorization'] = `Bearer ${config.key}`;
      }

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: {},
          query: userMessage.content,
          response_mode: 'streaming',
          user: 'user-123', // Unique user ID
          conversation_id: '', // Empty for new conversation or manage ID if needed
          auto_generate_name: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      if (!response.body) throw new Error('Response body is null');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') continue;

            try {
              const data: StreamEvent = JSON.parse(jsonStr);

              if (data.event === 'message' || data.event === 'agent_message') {
                const answer = data.answer || '';
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + answer }
                      : msg
                  )
                );
              } else if (data.event === 'error') {
                console.error('Stream error:', data);
                throw new Error(data.message || 'Stream error');
              }
            } catch (e) {
              console.error('Error parsing stream data:', e);
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error('Fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, content: msg.content + `\n[Error: ${errorMessage}]` }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClear = () => {
    setMessages([]);
    localStorage.removeItem('chat_messages');
    setShowClearConfirm(false);
  };

  return (
    <div className="chat-container">
      <div className="messages-area">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <div className="avatar">
              {msg.role === 'user' ? 'U' : 'AI'}
            </div>
            <div className="message-content">
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isMermaid = match && match[1] === 'mermaid';

                      if (!inline && isMermaid) {
                        return <MermaidBlock code={String(children).replace(/\n$/, '')} />;
                      }

                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.role === 'assistant' && isLoading && msg.content === '' && (
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className="icon-btn"
            onClick={clearChat}
            title="Clear Chat"
            disabled={isLoading || messages.length === 0}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowSettings(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <h2>Settings</h2>
            <div className="form-group">
              <label>Dify API URL</label>
              <input
                type="text"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://api.dify.ai/v1"
              />
              <small>Leave empty to use default environment variable.</small>
            </div>
            <div className="form-group">
              <label>Dify API Key</label>
              <input
                type="password"
                value={config.key}
                onChange={(e) => setConfig({ ...config, key: e.target.value })}
                placeholder="app-..."
              />
              <small>Leave empty to use default environment variable.</small>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setShowSettings(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '300px' }}>
            <h2>Clear Chat?</h2>
            <p style={{ marginBottom: '20px', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete all messages? This action cannot be undone.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
              <button
                className="btn-primary"
                style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }}
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ backgroundColor: '#ef4444' }}
                onClick={confirmClear}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
