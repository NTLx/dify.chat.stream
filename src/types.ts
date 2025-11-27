export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

export interface ChatRequest {
  inputs: Record<string, unknown>;
  query: string;
  response_mode: 'streaming' | 'blocking';
  user: string;
  conversation_id?: string;
  files?: unknown[];
  auto_generate_name?: boolean;
}

export interface StreamEvent {
  event: 'message' | 'agent_message' | 'message_end' | 'error' | 'ping';
  message_id?: string;
  conversation_id?: string;
  answer?: string;
  created_at?: number;
  id?: string; // For error or other events
  code?: string;
  status?: number;
  message?: string;
}
