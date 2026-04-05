import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { socket } from '../socket';
import { useAuthStore } from '../store/authStore';
import { Paperclip, Send, Image as ImageIcon, X } from 'lucide-react';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function ChatArea({ room }: { room: any }) {
  const { user, token } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    fetchMessages();
    socket.emit('join_room', room._id);

    socket.on('receive_message', (message: any) => {
      if (message.roomId === room._id) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });

    socket.on('user_typing', ({ username, roomId }: any) => {
      if (roomId === room._id) setIsTyping(username);
    });

    socket.on('user_stopped_typing', ({ roomId }: any) => {
      if (roomId === room._id) setIsTyping(null);
    });

    return () => {
      socket.emit('leave_room', room._id);
      socket.off('receive_message');
      socket.off('user_typing');
      socket.off('user_stopped_typing');
    };
  }, [room._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/messages/${room._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    // Typing indicator logic
    socket.emit('typing', room._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', room._id);
    }, 1000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const uploadFileToS3 = async (file: File) => {
    try {
      // 1. Get presigned URL
      const { data } = await axios.get(`${API_URL}/upload/presigned-url`, {
        params: { filename: file.name, filetype: file.type },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // 2. Upload file to S3
      await axios.put(data.presignedUrl, file, {
        headers: { 'Content-Type': file.type }
      });
      
      return data.fileUrl;
    } catch (err) {
      console.error('File upload failed:', err);
      return null;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedFile) return;

    let fileUrl = null;
    let type = 'text';

    if (selectedFile) {
      fileUrl = await uploadFileToS3(selectedFile);
      if (selectedFile.type.startsWith('image/')) type = 'image';
      else if (selectedFile.type.startsWith('audio/')) type = 'audio';
    }

    socket.emit('send_message', {
      roomId: room._id,
      type,
      content: input,
      fileUrl,
      fileName: selectedFile?.name
    });

    socket.emit('stop_typing', room._id);
    setInput('');
    clearFile();
  };

  const getRoomName = () => {
    if (room.isGroup) return room.name;
    const otherMember = room.members.find((m: any) => m._id !== user?.id);
    return otherMember ? otherMember.username : 'Unknown User';
  };

  return (
    <div className="flex flex-col h-full bg-[#111]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card flex items-center shadow-sm">
        <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold mr-4">
          {getRoomName()[0].toUpperCase()}
        </div>
        <div>
          <h2 className="font-semibold text-lg">{getRoomName()}</h2>
          <p className="text-xs text-muted-foreground">
            {room.isGroup ? `${room.members.length} members` : 'Direct Message'}
          </p>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isOwn = msg.senderId._id === user?.id;
          return (
            <div key={idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className="flex items-end mb-1 space-x-2">
                {!isOwn && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {msg.senderId.username}
                  </span>
                )}
              </div>
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-foreground rounded-bl-none border border-border'}`}>
                {msg.type === 'image' && msg.fileUrl && (
                  <img src={msg.fileUrl} alt="attachment" className="rounded-lg mb-2 max-w-full h-auto max-h-64 object-cover" />
                )}
                {msg.type === 'audio' && msg.fileUrl && (
                  <audio controls src={msg.fileUrl} className="mb-2 max-w-full" />
                )}
                {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                
                {msg.type !== 'image' && msg.type !== 'audio' && msg.fileUrl && (
                  <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-blue-300 underline text-sm">
                    {msg.fileName || 'Download Attachment'}
                  </a>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {format(new Date(msg.createdAt), 'HH:mm')}
              </span>
            </div>
          );
        })}
        {isTyping && (
          <div className="text-sm text-muted-foreground italic flex items-center">
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce mr-1" />
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce mr-1 delay-75" />
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce mr-2 delay-150" />
            {isTyping} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-card border-t border-border">
        {selectedFile && (
          <div className="mb-3 flex items-center space-x-3 p-3 bg-muted rounded-lg w-fit relative pr-10">
            {previewUrl ? (
              <img src={previewUrl} alt="preview" className="w-12 h-12 rounded object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            )}
            <span className="text-sm text-foreground truncate max-w-xs">{selectedFile.name}</span>
            <button
              onClick={clearFile}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-black/50 hover:bg-black rounded-full"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <label className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-full transition">
            <Paperclip className="w-5 h-5" />
            <input type="file" className="hidden" onChange={handleFileChange} />
          </label>
          <input
            type="text"
            className="flex-1 bg-muted text-foreground rounded-full px-5 py-3 focus:outline-none focus:ring-1 focus:ring-primary placeholder-muted-foreground"
            placeholder="Message..."
            value={input}
            onChange={handleInputChange}
          />
          <button
            type="submit"
            disabled={!input.trim() && !selectedFile}
            className="p-3 bg-primary text-primary-foreground hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition flex items-center justify-center shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
