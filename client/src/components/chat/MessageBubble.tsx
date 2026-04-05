import { format } from 'date-fns';
import { CheckCircle2, Clock, FileText } from 'lucide-react';
import { Message } from '../../store/chatStore';

interface BubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
  showHeader: boolean;
}

export default function MessageBubble({ message, isOwn, senderName, showHeader }: BubbleProps) {
  
  const timeStr = message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : '';

  return (
    <div className={`flex flex-col max-w-[75%] md:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
      
      {showHeader && !isOwn && (
        <span className="text-xs text-muted-foreground ml-1 mb-1 font-medium tracking-wide">
          {senderName}
        </span>
      )}

      <div className={`relative px-4 py-3 shadow-sm ${
        isOwn 
          ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm' 
          : 'bg-card text-foreground rounded-2xl rounded-bl-sm border border-border/50'
      }`}>
        
        {/* Media Renders */}
        {message.type === 'image' && message.fileUrl && (
          <div className="mb-2 relative group overflow-hidden rounded-lg bg-black/20">
            <img src={message.fileUrl} alt="attachment" className="max-w-full h-auto max-h-64 object-cover" />
          </div>
        )}
        
        {message.type === 'audio' && message.fileUrl && (
          <div className="mb-2">
            <audio controls src={message.fileUrl} className="max-w-[200px] h-10 outline-none" />
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {message.content}
          </p>
        )}

        {/* File Download (for documents) */}
        {message.type === 'document' && message.fileUrl && (
          <a href={message.fileUrl} target="_blank" rel="noreferrer" className="flex items-center space-x-2 mt-2 p-2 bg-black/10 rounded hover:bg-black/20 transition">
            <FileText className="w-4 h-4" />
            <span className="text-sm underline underline-offset-2 decoration-primary/50">{message.fileName || 'Attachment'}</span>
          </a>
        )}

        {/* Footer Meta */}
        <div className={`flex items-center justify-end mt-1 space-x-1 select-none ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
           <span className="text-[10px]">{timeStr}</span>
           
           {/* Status Icons */}
           {isOwn && (
             <span className="ml-1">
               {message.status === 'sending' ? (
                 <Clock className="w-3 h-3 animate-pulse opacity-70" />
               ) : (
                 <CheckCircle2 className="w-3 h-3 text-white opacity-90" />
               )}
             </span>
           )}
        </div>
      </div>
    </div>
  );
}
