import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Smile,
  Hash,
  Shield,
  Sparkles,
  BookOpen,
  GraduationCap,
  Heart,
  ThumbsUp,
  Zap,
} from 'lucide-react';
import katex from 'katex';
import { UserProfile, GradeLevel, StudentChatMessage, ChatChannel } from '../types';

interface StudentCommunityChatViewProps {
  currentUser: UserProfile;
  grades: GradeLevel[];
  channels: ChatChannel[];
  messages: StudentChatMessage[];
  onSendMessage: (channelId: string, text: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
}

export const StudentCommunityChatView: React.FC<StudentCommunityChatViewProps> = ({
  currentUser,
  grades,
  channels,
  messages,
  onSendMessage,
  onAddReaction,
}) => {
  // Filter channels available to the student
  const availableChannels = channels.filter(
    (c) => c.gradeId === 'all' || !currentUser.gradeId || c.gradeId === currentUser.gradeId
  );

  const [activeChannelId, setActiveChannelId] = useState<string>(
    availableChannels[0]?.id || 'chan-general'
  );
  const [inputText, setInputText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeChannel =
    channels.find((c) => c.id === activeChannelId) || availableChannels[0] || channels[0];

  const channelMessages = messages.filter((m) => m.channelId === activeChannelId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [channelMessages.length]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    onSendMessage(activeChannelId, text);
    setInputText('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleQuickReaction = (messageId: string, emoji: string) => {
    if (onAddReaction) {
      onAddReaction(messageId, emoji);
    }
  };

  const formatChatMessage = (text: string) => {
    // Basic inline math parse
    const parts = text.split(/(\$[^\$\n]+?\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        try {
          const html = katex.renderToString(part.slice(1, -1), {
            displayMode: false,
            throwOnError: false,
            strict: false,
          });
          return (
            <span
              key={i}
              className="inline-math px-1 py-0.5 text-[#FEF08A] font-medium"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return part;
        }
      }
      return part;
    });
  };

  return (
    <div className="h-[calc(100vh-5.5rem)] rounded-3xl bg-black/75 backdrop-blur-2xl border border-white/15 shadow-2xl flex overflow-hidden text-slate-100">
      {/* Left Sidebar: Channels List */}
      <div className="w-64 sm:w-72 bg-black/60 border-r border-white/10 flex flex-col justify-between shrink-0">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7F1D1D] to-[#991B1B] border border-[#FACC15]/60 flex items-center justify-center shadow-md shrink-0">
              <Users className="w-4 h-4 text-[#FACC15]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white truncate font-display">
                Comunidad Oppenheimer
              </h3>
              <p className="text-[10px] text-emerald-400 font-mono-tabular">
                Chat Escolar Colaborativo
              </p>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block mb-1.5">
              Canales y Salones de Estudio
            </span>
            <div className="space-y-1">
              {availableChannels.map((chan) => {
                const isActive = chan.id === activeChannelId;
                return (
                  <button
                    key={chan.id}
                    type="button"
                    onClick={() => setActiveChannelId(chan.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white shadow-md border border-[#FACC15]/40'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-sm shrink-0">{chan.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{chan.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coexistence Guidelines Footer */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-[10px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-[#FEF08A] font-bold">
            <Shield className="w-3 h-3 text-[#FACC15]" />
            <span>Convivencia Digital Escolar</span>
          </div>
          <p className="leading-tight text-slate-400">
            Promovemos el respeto mutuo, el apoyo en tareas y la cordialidad entre compañeros.
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Channel Header */}
        <div className="h-14 shrink-0 px-6 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{activeChannel?.icon || '💬'}</span>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                {activeChannel?.name || 'Canal de Conversación'}
              </h3>
              <p className="text-[10px] text-slate-300 truncate max-w-md">
                {activeChannel?.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{channelMessages.length} mensajes</span>
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {channelMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">
                {activeChannel?.icon || '💬'}
              </div>
              <h4 className="text-sm font-bold text-white">
                ¡Sé el primero en iniciar la conversación!
              </h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Comparte una pregunta sobre las tareas del día, saluda a tus compañeros o coordina un grupo de estudio.
              </p>
            </div>
          ) : (
            channelMessages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const isTeacher = msg.senderRole === 'docente';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 group/msg ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMe && (
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow mt-0.5 border ${
                        isTeacher
                          ? 'bg-[#7F1D1D] border-[#FACC15]/60 text-[#FEF08A]'
                          : 'bg-slate-800 border-white/20 text-white'
                      }`}
                    >
                      {msg.avatarInitials}
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 shadow-lg relative ${
                      isMe
                        ? 'bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] text-white border border-[#FACC15]/40 rounded-tr-none'
                        : isTeacher
                        ? 'bg-slate-900/90 border-2 border-[#FACC15]/60 text-slate-100 rounded-tl-none'
                        : 'bg-black/60 backdrop-blur-xl border border-white/15 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 text-[10px] pb-1.5 mb-1.5 border-b border-white/10">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={isTeacher ? 'text-[#FACC15]' : 'text-[#FEF08A]'}>
                          {msg.senderName}
                        </span>
                        {isTeacher && (
                          <span className="bg-[#7F1D1D] px-1.5 py-0.2 rounded text-[9px] text-[#FEF08A] border border-[#FACC15]/40">
                            Docente
                          </span>
                        )}
                      </div>
                      <span className="font-mono-tabular opacity-75">{msg.timestamp}</span>
                    </div>

                    {/* Message Text */}
                    <div className="text-xs sm:text-[13px] leading-relaxed break-words">
                      {formatChatMessage(msg.text || msg.content || '')}
                    </div>

                    {/* Quick Reactions Display & Action */}
                    <div className="mt-2 pt-1 flex items-center gap-1.5 text-[11px]">
                      {msg.reactions &&
                        Object.entries(
                          Array.isArray(msg.reactions) ? {} : msg.reactions
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleQuickReaction(msg.id, emoji)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 cursor-pointer text-xs"
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] font-bold text-slate-300">{count}</span>
                          </button>
                        ))}

                      {/* Add reaction trigger */}
                      <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-1 ml-1">
                        {['👍', '❤️', '💡', '⚡', '🙌'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleQuickReaction(msg.id, emoji)}
                            className="p-1 hover:scale-125 transition-transform text-xs cursor-pointer"
                            title={`Reaccionar con ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <div className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-md">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Escribe un mensaje en ${activeChannel?.name || 'el canal'} (ej. "¿Quién resolvió el ejercicio 2?")...`}
                className="w-full pl-4 pr-12 py-3 rounded-2xl bg-slate-900 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:border-[#FACC15]"
              />
              <div className="absolute right-3 flex items-center gap-1">
                {['👍', '💡', '⚡', '📚'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setInputText((prev) => `${prev} ${emoji} `)}
                    className="hover:scale-125 transition-transform text-xs cursor-pointer p-0.5"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-[#7F1D1D] to-[#991B1B] hover:from-[#991B1B] hover:to-[#B91C1C] disabled:opacity-40 text-white border border-[#FACC15]/40 shadow-lg cursor-pointer transition-all shrink-0"
              title="Enviar mensaje al salón"
            >
              <Send className="w-4 h-4 text-[#FACC15]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
