import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { socket } from '../../socket';
import { Info, Menu } from 'lucide-react';
import MessageList from './MessageList.tsx';
import ChatInput from './ChatInput.tsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function ChatContainer({ room }: { room: any }) {
  const { setMessages, messages, addMessage, toggleRightPane, setTypingUser } = useChatStore();
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!room) return;
    
    // Fetch initial messages
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/messages/${room._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    socket.emit('join_room', room._id);

    const handleReceiveMessage = (message: any) => {
      if (message.roomId === room._id) {
        addMessage(message);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      socket.emit('leave_room', room._id);
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [room, token]);

  if (!room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-background">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
           <svg className="w-10 h-10 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
           </svg>
        </div>
        <p className="text-xl font-semibold tracking-tight">Your Messages</p>
        <p className="text-sm opacity-60 mt-2">Select a chat or start a new conversation</p>
      </div>
    );
  }

  const getDMRoomName = (r: any) => {
    if (r.isGroup) return r.name;
    const otherMember = r.members.find((m: any) => m._id !== user?.id);
    return otherMember ? otherMember.username : 'Unknown User';
  };

  return (
    <div className="flex flex-col h-full bg-background relative grid-rows-[auto_1fr_auto]">
      {/* Header */}
      <div className="h-16 px-6 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-sm">
            {getDMRoomName(room)[0].toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-base leading-tight">{getDMRoomName(room)}</h2>
            <p className="text-xs text-muted-foreground">
              {room.isGroup ? `${room.members.length} members` : 'Direct Message'}
            </p>
          </div>
        </div>
        <button 
          onClick={toggleRightPane}
          className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-hidden relative">
         <MessageList loading={loading} />
      </div>

      {/* Input Area */}
      <div className="bg-background border-t border-border p-4">
         <ChatInput roomId={room._id} />
      </div>
    </div>
  );
}
