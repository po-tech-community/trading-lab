import { useState, useCallback } from 'react';
import type { McpExecution } from '@/components/mcp/McpExecutionPanel';
import type { MarketSnapshotData, RiskCheckData, AllocationDiagnosticsData } from '@/components/mcp/ResultCards';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  mcpExecution?: McpExecution;
  resultCards?: {
    marketSnapshot?: MarketSnapshotData;
    riskCheck?: RiskCheckData;
    allocationDiagnostics?: AllocationDiagnosticsData;
  };
}

export interface UseMcpChatReturn {
  messages: ChatMessage[];
  addTextMessage: (text: string, sender: 'user' | 'ai') => void;
  /** Adds an empty AI message and returns its id — use appendToMessage to fill it. */
  startStreamingMessage: () => string;
  /** Appends a token to an existing message by id. */
  appendToMessage: (id: string, token: string) => void;
  addMcpExecution: (execution: Omit<McpExecution, 'id' | 'timestamp'>) => string;
  updateMcpExecution: (id: string, updates: Partial<McpExecution>) => void;
  approveMcpExecution: (id: string) => void;
  denyMcpExecution: (id: string) => void;
  addResultCards: (cards: {
    marketSnapshot?: MarketSnapshotData;
    riskCheck?: RiskCheckData;
    allocationDiagnostics?: AllocationDiagnosticsData;
  }) => void;
  clearMessages: () => void;
}

export function useMcpChat(initialMessages: ChatMessage[] = []): UseMcpChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const addTextMessage = useCallback((text: string, sender: 'user' | 'ai') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  /** Creates an empty AI message placeholder and returns its id. */
  const startStreamingMessage = useCallback((): string => {
    const id = `stream-${Date.now()}`;
    const newMessage: ChatMessage = {
      id,
      text: '',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return id;
  }, []);

  /** Appends a token to an existing message in-place (no new message added). */
  const appendToMessage = useCallback((id: string, token: string) => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === id ? { ...msg, text: msg.text + token } : msg,
      ),
    );
  }, []);

  const addMcpExecution = useCallback((executionData: Omit<McpExecution, 'id' | 'timestamp'>) => {
    const id = Date.now().toString();
    const execution: McpExecution = {
      ...executionData,
      id,
      timestamp: new Date(),
    };

    const newMessage: ChatMessage = {
      id: `mcp-${id}`,
      text: `MCP Tool Execution: ${execution.toolName}`,
      sender: 'ai',
      timestamp: new Date(),
      mcpExecution: execution,
    };

    setMessages(prev => [...prev, newMessage]);
    return id;
  }, []);

  const updateMcpExecution = useCallback((id: string, updates: Partial<McpExecution>) => {
    setMessages(prev => prev.map(msg => {
      if (msg.mcpExecution?.id === id) {
        return {
          ...msg,
          mcpExecution: msg.mcpExecution ? { ...msg.mcpExecution, ...updates } : undefined,
        };
      }
      return msg;
    }));
  }, []);

  const approveMcpExecution = useCallback((id: string) => {
    updateMcpExecution(id, { status: 'approved' });
    // Simulate execution after approval
    setTimeout(() => {
      updateMcpExecution(id, { status: 'executing' });
      setTimeout(() => {
        updateMcpExecution(id, { status: 'completed' });
      }, 2000);
    }, 500);
  }, [updateMcpExecution]);

  const denyMcpExecution = useCallback((id: string) => {
    updateMcpExecution(id, { status: 'denied' });
  }, [updateMcpExecution]);

  const addResultCards = useCallback((cards: {
    marketSnapshot?: MarketSnapshotData;
    riskCheck?: RiskCheckData;
    allocationDiagnostics?: AllocationDiagnosticsData;
  }) => {
    const newMessage: ChatMessage = {
      id: `results-${Date.now()}`,
      text: 'Analysis Results',
      sender: 'ai',
      timestamp: new Date(),
      resultCards: cards,
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  return {
    messages,
    addTextMessage,
    startStreamingMessage,
    appendToMessage,
    addMcpExecution,
    updateMcpExecution,
    approveMcpExecution,
    denyMcpExecution,
    addResultCards,
    clearMessages,
  };
}