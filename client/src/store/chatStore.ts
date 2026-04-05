import { create } from 'zustand';

export interface Message {
  _id?: string;
  roomId: string;
  senderId: any;
  type: 'text' | 'image' | 'audio' | 'document';
  content: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  status?: 'sending' | 'sent';
  tempId?: string;
}

export interface Room {
  _id: string;
  name: string;
  isGroup: boolean;
  members: any[];
}

interface ChatState {
  activeRoom: Room | null;
  messages: Message[];
  typingUsers: { [roomId: string]: string[] };
  showRightPane: boolean;
  
  setActiveRoom: (room: Room | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageStatus: (id: string, status: 'sent') => void;
  setTypingUser: (roomId: string, username: string | null) => void;
  toggleRightPane: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeRoom: null,
  messages: [],
  typingUsers: {},
  showRightPane: false,

  setActiveRoom: (room) => set({ activeRoom: room }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => {
    // If we have a tempId, try to replace the optimistic message
    if (message.tempId) {
      const existingIndex = state.messages.findIndex(m => m._id === message.tempId);
      if (existingIndex !== -1) {
        const newMessages = [...state.messages];
        newMessages[existingIndex] = { ...message, status: 'sent' };
        return { messages: newMessages };
      }
    }

    // Check if message already exists
    const exists = state.messages.find(m => m._id === message._id);
    if (exists) return state; // Avoid duplicates
    
    return { messages: [...state.messages, { ...message, status: 'sent' }] };
  }),

  updateMessageStatus: (localId, status) => set((state) => ({
    // For simplicity, we assume we might map local IDs later, but the broadcast sets it directly.
    messages: state.messages.map(m => m)
  })),
  
  setTypingUser: (roomId, username) => set((state) => {
    const currentTyping = state.typingUsers[roomId] || [];
    if (username) {
      if (!currentTyping.includes(username)) {
        return { typingUsers: { ...state.typingUsers, [roomId]: [...currentTyping, username] } };
      }
    } else {
      // Clear typing for room or specific user (simplified here to clear all for now)
      return { typingUsers: { ...state.typingUsers, [roomId]: [] } };
    }
    return state;
  }),

  toggleRightPane: () => set((state) => ({ showRightPane: !state.showRightPane })),
}));
