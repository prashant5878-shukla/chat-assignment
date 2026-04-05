import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import MessageBubble from './MessageBubble';

export default function MessageList({ loading }: { loading: boolean }) {
  const { messages, activeRoom, typingUsers } = useChatStore();
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent flex-shrink-0 rounded-full animate-spin"></div>
      </div>
    );
  }

  const typingArray = typingUsers[activeRoom?._id || ''] || [];
  const validTypingUsers = typingArray.filter(u => u !== user?.username);

  return (
    <div className="absolute inset-0 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-background">
      <div className="flex flex-col space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId._id === user?.id || msg.senderId === user?.id; // backend populates it sometimes
            const senderName = msg.senderId.username || 'Unknown';
            
            // grouping to avoid repeated avatarts
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const showHeader = !prevMsg || (prevMsg.senderId._id !== msg.senderId._id && prevMsg.senderId !== msg.senderId);

            return (
              <motion.div
                key={msg._id || `temp-${index}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                layout
                className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
              >
                <MessageBubble 
                  message={msg} 
                  isOwn={isOwn} 
                  senderName={senderName} 
                  showHeader={showHeader} 
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        <AnimatePresence>
          {validTypingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center text-muted-foreground text-sm italic bg-card/50 rounded-full px-4 py-2 w-fit border border-border"
            >
              <div className="flex space-x-1 mr-3">
                <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
              </div>
              {validTypingUsers.join(', ')} {validTypingUsers.length > 1 ? 'are' : 'is'} typing...
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}
