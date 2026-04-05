import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Users, LogOut, Search, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Sidebar() {
  const { user, token, logout } = useAuthStore();
  const { activeRoom, setActiveRoom, toggleRightPane } = useChatStore();
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [networkUsers, setNetworkUsers] = useState<any[]>([]);
  const [showUsers, setShowUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [token]);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
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
      setNetworkUsers(data);
      setShowUsers(true);
    } catch (err) {
      console.error('Failed to fetch users', err);
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
      
      if (!rooms.find(r => r._id === data._id)) {
        setRooms([data, ...rooms]);
      }
      setActiveRoom(data);
      setShowUsers(false);
    } catch (err) {
      console.error('Failed to create room', err);
    }
  };

  const getDMRoomName = (room: any) => {
    if (room.isGroup) return room.name;
    const otherMember = room.members.find((m: any) => m._id !== user?.id);
    return otherMember ? otherMember.username : 'Unknown User';
  };

  const filteredItems = showUsers 
    ? networkUsers.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    : rooms.filter(r => getDMRoomName(r).toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-card/80 text-foreground">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">Messages</h1>
        </div>
        <button onClick={fetchUsers} className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors flex items-center justify-center">
          {showUsers ? <X className="w-5 h-5" /> : <Users className="w-5 h-5" />}
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text"
            placeholder={showUsers ? "Search network..." : "Search chats..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border border-border/50 text-sm rounded-full pl-9 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {showUsers && <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3 pt-2">Available Users</h3>}
        {!showUsers && <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-3 pt-2">Recent Chats</h3>}

        {filteredItems.map(item => {
          const id = showUsers ? item._id : item._id;
          const name = showUsers ? item.username : getDMRoomName(item);
          const isSelected = !showUsers && activeRoom?._id === id;

          return (
            <button
              key={id}
              onClick={() => showUsers ? createDMRoom(item) : setActiveRoom(item)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                isSelected 
                  ? 'bg-primary shadow-md text-white' 
                  : 'hover:bg-muted/80 text-foreground'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  isSelected ? 'bg-white/20' : 'bg-primary/20 text-primary group-hover:bg-primary/30'
                }`}>
                  {name[0].toUpperCase()}
                </div>
                {((showUsers && item.isOnline) || (!showUsers && item.members?.find((m:any) => m._id !== user?.id && m.isOnline))) && (
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isSelected ? 'border-primary' : 'border-card'} bg-green-500`} />
                )}
              </div>
              <div className="ml-3 text-left overflow-hidden flex-1">
                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-white' : 'text-foreground'}`}>
                  {name}
                </p>
                {!showUsers && (
                   <p className={`text-xs truncate ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
                     Click to view messages
                   </p>
                )}
              </div>
            </button>
          )
        })}
        {filteredItems.length === 0 && (
          <div className="text-center mt-10 text-muted-foreground text-sm px-4">
               {showUsers ? 'No users found.' : 'No active chats. Search for users to start.'}
          </div>
        )}
      </div>

      {/* Footer Profile */}
      <div className="p-4 border-t border-border mt-auto flex items-center justify-between bg-muted/20">
        <div className="flex items-center space-x-3 truncate">
          <div className="w-9 h-9 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
            {user?.username[0].toUpperCase()}
          </div>
          <div className="truncate pr-2">
            <p className="text-sm font-semibold truncate">{user?.username}</p>
            <p className="text-[10px] text-green-400 font-medium">Online</p>
          </div>
        </div>
        <button onClick={logout} className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-muted-foreground hover:text-red-400">
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
