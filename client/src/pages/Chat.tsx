import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

export default function Chat() {
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom} />
      <div className="flex-1 flex flex-col h-full bg-[#111]">
        {selectedRoom ? (
          <ChatArea room={selectedRoom} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-lg font-medium">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
