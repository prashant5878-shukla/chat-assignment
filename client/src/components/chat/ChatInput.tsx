import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, X, Mic, FileText } from 'lucide-react';
import { socket } from '../../socket';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function ChatInput({ roomId }: { roomId: string }) {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const typingTimeoutRef = useRef<any>(null);
  
  const { token, user } = useAuthStore();
  const { addMessage, updateMessageStatus } = useChatStore();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    // Strict 2-second typing debounce
    socket.emit('typing', roomId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', roomId);
    }, 2000);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (f.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(f));
      } else {
        setPreview(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setUploadProgress(0);
  };

  const uploadToS3 = async (f: File) => {
    try {
      const { data } = await axios.get(`${API_URL}/upload/presigned-url`, {
        params: { filename: f.name, filetype: f.type },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await axios.put(data.presignedUrl, f, {
        headers: { 'Content-Type': f.type },
        onUploadProgress: (progressEvent) => {
           const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || f.size));
           setUploadProgress(percentCompleted);
        }
      });
      return data.fileUrl;
    } catch (err) {
      console.error('Upload error', err);
      return null;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    // Immediately create local message state as 'sending'
    const tempId = Math.random().toString(36).substring(7);
    let type: 'text' | 'image' | 'audio' | 'document' = 'text';
    if (file) {
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else type = 'document';
    }

    const tempMessage = {
      _id: tempId,
      roomId,
      senderId: { _id: user?.id, username: user?.username },
      type,
      content: input,
      fileUrl: preview || undefined, 
      fileName: file?.name,
      createdAt: new Date().toISOString(),
      status: 'sending' as const
    };

    // addMessage(tempMessage);

    // Keep inputs disabled during upload? No, clearing them is better UX, 
    // but the file upload is async.
    const textSnapshot = input;
    const fileSnapshot = file;
    
    setInput('');
    clearFile();
    socket.emit('stop_typing', roomId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    let finalFileUrl = undefined;
    if (fileSnapshot) {
      finalFileUrl = await uploadToS3(fileSnapshot);
    }

    // Now emit the message to socket
    // Actually, local Temp Message works well with optimistic UI, but real DB will broadcast 'receive_message'
    // To avoid duplication, we rely on the server payload and handle duplication in store.
    socket.emit('send_message', {
      roomId,
      type,
      content: textSnapshot,
      fileUrl: finalFileUrl,
      fileName: fileSnapshot?.name,
      tempId // we can pass tempId to backend to broadcast it back to sender to reconcile status `sent`
    });

    // In a full offline-first architecture, we'd wait for an ack here, but for now we just change status
    setTimeout(() => {
      updateMessageStatus(tempId, 'sent');
    }, 500); // Simulate backend latency for status icon demonstration
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {file && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-full left-0 mb-3 ml-2 p-3 bg-card border border-border rounded-xl shadow-lg flex items-center space-x-3 w-72"
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-12 h-12 object-cover rounded shadow-inner" />
            ) : (
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                {file.type.startsWith('audio/') ? (
                   <Mic className="w-6 h-6 text-muted-foreground" />
                ) : (
                   <FileText className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-primary h-1.5 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>
            <button onClick={clearFile} className="p-1.5 bg-muted/80 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSend} className="flex items-center space-x-2 w-full">
        <label className="p-3 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer rounded-full transition-colors flex-shrink-0">
          <Paperclip className="w-5 h-5" />
          <input type="file" className="hidden" onChange={handleFile} />
        </label>
        
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Message..."
          className="flex-1 bg-muted/60 text-foreground border border-border/50 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all placeholder:text-muted-foreground"
        />

        <button
          type="submit"
          disabled={!input.trim() && !file}
          className="p-3 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex-shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
