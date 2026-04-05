import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Users, LogOut, Search } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Sidebar({
  selectedRoom,
  setSelectedRoom
}: {
  selectedRoom: any;
  setSelectedRoom: (room: any) => void;
}) {
  const { user, token, logout } = useAuthStore();
  const [rooms, setRooms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  const fetchUsers = async () => {
    if (showUsers) {
      setShowUsers(false);
      return;
    }
    try {
      const { data } = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data);
      setShowUsers(true);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const createDMRoom = async (otherUser: any) => {
    try {
      const { data } = await axios.post(`${API_URL}/rooms`, {
        isGroup: false,
        memberIds: [otherUser._id]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure the room exists in local state
      if (!rooms.find(r => r._id === data._id)) {
        setRooms([data, ...rooms]);
      }
      setSelectedRoom(data);
      setShowUsers(false);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  const getDMRoomName = (room: any) => {
    if (room.isGroup) return room.name;
    const otherMember = room.members.find((m: any) => m._id !== user?.id);
    return otherMember ? otherMember.username : 'Unknown User';
  };

  return (
    <div className="w-80 bg-card border-r border-border h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <h1 className="font-bold text-lg">Chats</h1>
        </div>
        <button onClick={fetchUsers} className="p-2 hover:bg-muted rounded-full transition" title="New Message">
          <Users className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {showUsers ? (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Start a Chat</h3>
            {users.map(u => (
              <button
                key={u._id}
                onClick={() => createDMRoom(u)}
                className="w-full flex items-center p-3 hover:bg-muted rounded-lg transition"
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold">
                    {u.username[0].toUpperCase()}
                  </div>
                  {u.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                  )}
                </div>
                <div className="ml-3 text-left">
                  <p className="font-semibold text-sm">{u.username}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            {rooms.map(room => (
              <button
                key={room._id}
                onClick={() => setSelectedRoom(room)}
                className={`w-full flex items-center p-3 rounded-lg transition ${
                  selectedRoom?._id === room._id ? 'bg-muted' : 'hover:bg-muted/50'
                }`}
              >
                <div className="w-10 h-10 bg-muted-foreground/20 text-muted-foreground rounded-full flex items-center justify-center font-bold">
                  {getDMRoomName(room)[0].toUpperCase()}
                </div>
                <div className="ml-3 text-left">
                  <p className="font-semibold text-sm">{getDMRoomName(room)}</p>
                </div>
              </button>
            ))}
            {rooms.length === 0 && (
              <div className="text-center mt-10 text-muted-foreground text-sm">
                No active chats. Click the users icon to start a conversation.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border mt-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold">
            {user?.username[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold">{user?.username}</p>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 hover:bg-muted rounded-full transition text-red-400">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
