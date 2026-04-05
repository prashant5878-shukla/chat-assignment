import React from 'react';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { X, Image, FileText, Bell, Shield, Trash2 } from 'lucide-react';

export default function RightPane() {
  const { activeRoom, toggleRightPane } = useChatStore();
  const { user } = useAuthStore();

  if (!activeRoom) return null;

  const getDMRoomName = (room: any) => {
    if (room.isGroup) return room.name;
    const otherMember = room.members.find((m: any) => m._id !== user?.id);
    return otherMember ? otherMember.username : 'Unknown User';
  };

  const getDMEmail = (room: any) => {
    if (room.isGroup) return `${room.members.length} members`;
    const otherMember = room.members.find((m: any) => m._id !== user?.id);
    return otherMember ? otherMember.email : '';
  };

  const name = getDMRoomName(activeRoom);

  return (
    <div className="flex flex-col h-full bg-card/50 text-foreground w-80">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm">Contact Info</h2>
        <button onClick={toggleRightPane} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Profile Card */}
        <div className="p-6 flex flex-col items-center border-b border-border text-center">
          <div className="w-24 h-24 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-4xl mb-4 shadow-xl shadow-primary/5">
            {name[0].toUpperCase()}
          </div>
          <h3 className="font-bold text-xl text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{getDMEmail(activeRoom)}</p>
        </div>

        {/* Options */}
        <div className="p-4 space-y-2 border-b border-border">
          <button className="w-full flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm">
            <Bell className="w-4 h-4 mr-3 text-muted-foreground" />
            Mute Notifications
          </button>
          <button className="w-full flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors text-sm">
             <Shield className="w-4 h-4 mr-3 text-muted-foreground" />
             Privacy & Security
          </button>
        </div>

        {/* Media Snippet */}
        <div className="p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Shared Media</h4>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-muted rounded-md flex items-center justify-center hover:opacity-80 transition cursor-pointer">
                <Image className="w-5 h-5 text-muted-foreground/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
