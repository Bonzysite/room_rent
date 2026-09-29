import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, MessageSquare, ShieldCheck, MapPin, ArrowUpRight, 
  Check, CheckCheck, Clock, UserCheck, Home, Search, Phone, 
  Sparkles, Smile, Circle, CheckCircle2, ChevronLeft
} from 'lucide-react';
import { Conversation, Message, Room, User } from '../types';
import { api } from '../utils/api';

interface MessagesViewProps {
  conversations: Conversation[];
  messages: Message[];
  rooms: Room[];
  currentUser: User;
  onSendMessage: (conversationId: string, text: string) => void;
  onSelectRoom: (room: Room) => void;
  activeConversationId?: string;
  setActiveConversationId: (id: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  conversations,
  messages,
  rooms,
  currentUser,
  onSendMessage,
  onSelectRoom,
  activeConversationId,
  setActiveConversationId
}) => {
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickChips] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLandlord = currentUser.role === 'landlord';

  // Filter conversations user is part of
  const myConversations = conversations.filter(c => c.participants.includes(currentUser.id));

  // Search filter for conversations list
  const filteredConversations = myConversations.filter(c => {
    const room = rooms.find(r => r.id === c.roomId);
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = room?.title.toLowerCase().includes(q);
    const cityMatch = room?.city.toLowerCase().includes(q);
    const lastMsgMatch = c.lastMessage.toLowerCase().includes(q);
    const landlordMatch = room?.landlordName.toLowerCase().includes(q);
    return titleMatch || cityMatch || lastMsgMatch || landlordMatch;
  });

  // Determine active conversation
  const selectedConv = myConversations.find(c => c.id === activeConversationId) || filteredConversations[0] || myConversations[0];

  const activeRoom = selectedConv ? rooms.find(r => r.id === selectedConv.roomId) : null;
  const conversationMessages = selectedConv
    ? messages.filter(m => m.conversationId === selectedConv.id)
    : [];

  // Determine partner details
  const partnerName = isLandlord ? 'Tenant Applicant' : (activeRoom?.landlordName || 'Property Owner');

  // Mark unread messages as read when active conversation is open
  useEffect(() => {
    if (selectedConv) {
      api.markMessagesAsRead(selectedConv.id, currentUser.id);
    }
  }, [selectedConv?.id, conversationMessages.length, currentUser.id]);

  // Auto-scroll to bottom of chat feed when messages update or conversation changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages.length, selectedConv?.id]);

  const handleSend = (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || !selectedConv) return;
    onSendMessage(selectedConv.id, textToSend.trim());
    if (!textOverride) setInputText('');
  };

  const QUICK_PROMPTS = isLandlord ? [
    "🗓️ When would you like to schedule the property walkthrough?",
    "⚡ Generator and poly tank water backups are tested and operational.",
    "📄 Application reviewed! Please confirm your target move-in date.",
    "🤝 Let's discuss lease payment options (6-month or 1-year advance)."
  ] : [
    "🗓️ Is this property available for physical inspection this weekend?",
    "⚡ Does the generator start automatically during dumsor power outages?",
    "🚰 Is poly tank water supply connected directly to the bathroom?",
    "💰 Are utility bills (water/garbage) included in the GH₵ price?"
  ];

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[78vh] transition-all">
      
      {/* Sidebar: WhatsApp-style Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col bg-slate-950/70 ${
        selectedConv && activeConversationId ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Sidebar Header & Search Bar */}
        <div className="p-4 border-b border-slate-800/80 space-y-3 bg-slate-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-extrabold text-white">WhatsApp Chat Hub</h2>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
              {myConversations.length} Active Threads
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts, properties, or chats..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-600" />
              <p className="font-semibold text-slate-400">No active chat threads found</p>
              <p className="text-[11px]">
                {isLandlord 
                  ? "When tenants submit applications or inquiries, their chats will appear here instantly." 
                  : "Browse properties and click 'Chat Landlord' or submit an application to start messaging homeowners."}
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const room = rooms.find(r => r.id === conv.roomId);
              const isSelected = selectedConv && selectedConv.id === conv.id;
              const convMsgs = messages.filter(m => m.conversationId === conv.id);
              const unreadCount = convMsgs.filter(m => !m.read && m.senderId !== currentUser.id).length;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-l-4 border-emerald-500'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  {/* Property Thumbnail */}
                  <div className="relative shrink-0">
                    <img
                      src={room?.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=200&q=80'}
                      alt="room thumbnail"
                      className="h-12 w-12 rounded-xl object-cover border border-slate-800"
                    />
                    <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-slate-950 font-bold border border-slate-950">
                      ●
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate">
                        {room?.title || 'Room Inquiry'}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-1">
                        {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-emerald-400 font-semibold truncate">
                        {isLandlord ? 'Tenant Applicant' : (room?.landlordName || 'Landlord')}
                        {room ? ` • GH₵ ${room.price.toLocaleString()}` : ''}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-extrabold text-slate-950">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mt-1 flex items-center gap-1">
                      <CheckCheck className="h-3 w-3 text-emerald-400 inline shrink-0" />
                      <span>{conv.lastMessage}</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Panel (WhatsApp Chat Window) */}
      {selectedConv ? (
        <div className={`flex-1 flex flex-col bg-slate-900/40 ${
          !selectedConv && !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* WhatsApp Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button */}
              <button
                onClick={() => setActiveConversationId('')}
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-slate-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="relative">
                <img
                  src={activeRoom?.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=200&q=80'}
                  alt={activeRoom?.title}
                  className="h-10 w-10 rounded-xl object-cover border border-slate-800 ring-2 ring-emerald-500/30"
                />
                <span className="absolute -bottom-1 -right-1 flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white">{partnerName}</h3>
                  <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/20 px-2 py-0.2 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="text-emerald-400 font-bold">
                    {activeRoom?.title ? `${activeRoom.title} • GH₵ ${activeRoom.price.toLocaleString()}/mo` : 'Active Discussion'}
                  </span>
                </p>
              </div>
            </div>

            {/* Header Right Action Buttons */}
            <div className="flex items-center gap-2">
              {activeRoom && (
                <button
                  onClick={() => onSelectRoom(activeRoom)}
                  className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
                >
                  View Room
                  <ArrowUpRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Message Feed: WhatsApp Speech Bubbles */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-950/30">
            {conversationMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs space-y-2">
                <MessageSquare className="h-10 w-10 text-emerald-500/40 mb-1" />
                <p className="font-bold text-white text-sm">Direct Messaging Connected</p>
                <p className="text-xs text-slate-400 max-w-xs text-center">
                  Messages sent here are saved and delivered directly between tenant and landlord.
                </p>
              </div>
            ) : (
              conversationMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-md relative ${
                        isMe
                          ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/60'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${
                        isMe ? 'text-emerald-200' : 'text-slate-400'
                      }`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && <CheckCheck className="h-3.5 w-3.5 text-emerald-300" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggestion Chips */}
          {showQuickChips && (
            <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Quick Chat:</span>
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(undefined, prompt)}
                  className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 active:scale-95 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => handleSend(e)}
            className="border-t border-slate-800/80 bg-slate-950 p-3.5 flex items-center gap-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message, ask about generator runtime or confirm visit..."
              className="flex-1 rounded-xl border border-slate-700/80 bg-slate-900 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex items-center justify-center rounded-xl bg-emerald-500 h-10 w-10 text-slate-950 hover:bg-emerald-400 disabled:opacity-40 disabled:pointer-events-none shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
            >
              <Send className="h-4 w-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 bg-slate-950/30">
          <MessageSquare className="h-12 w-12 text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-white">No active chat selected</h3>
          <p className="text-xs max-w-sm mt-1">Select an active conversation from the left sidebar to start messaging.</p>
        </div>
      )}
    </div>
  );
};
