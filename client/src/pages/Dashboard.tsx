import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { socket } from '../socket';
import MainLayout from '../components/layout/MainLayout';
import Sidebar from '../components/sidebar/Sidebar';
import ChatContainer from '../components/chat/ChatContainer';
import RightPane from '../components/info/RightPane';

export default function Dashboard() {
  const { activeRoom, setTypingUser } = useChatStore();

  // Handle global socket listeners for typing indicators
  useEffect(() => {
    const handleTyping = ({ username, roomId }: { username: string, roomId: string }) => {
      setTypingUser(roomId, username);
    };

    const handleStopTyping = ({ roomId }: { roomId: string }) => {
      setTypingUser(roomId, null); // Clear typing user for room
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStopTyping);
    };
  }, [setTypingUser]);

  return (
    <MainLayout
      sidebar={<Sidebar />}
      chatArea={<ChatContainer room={activeRoom} />}
      infoPane={<RightPane />}
    />
  );
}
