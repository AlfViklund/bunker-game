'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Player } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, Bot, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface ChatPhaseProps {
  roomId: string;
  currentUserId: string;
  userNickname: string;
  players: Player[];
}

export default function ChatPhase({ roomId, currentUserId, userNickname, players }: ChatPhaseProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`room_messages_${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bunker_messages', filter: `room_id=eq.${roomId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('bunker_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async (textToSend?: string) => {
    const text = textToSend || input.trim();
    if (!text) return;

    if (!textToSend) setInput('');

    await supabase.from('bunker_messages').insert({
      room_id: roomId,
      sender_id: currentUserId,
      sender_name: userNickname,
      is_bot: false,
      message: text,
    });

    // Trigger AI bots to reply to the user message
    const botPlayers = players.filter((p) => p.is_bot && !p.is_eliminated);
    if (botPlayers.length > 0) {
      const selectedBot = botPlayers[Math.floor(Math.random() * botPlayers.length)];
      fetch('/api/bot-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          botUserId: selectedBot.user_id,
          phase: 'debate',
          humanPrompt: text,
        }),
      }).catch((err) => console.warn('Bot reply error:', err));
    }
  };

  const getBotColorClass = (personality: string | null) => {
    if (personality === 'panic') return 'text-rose-400 border-rose-800/60 bg-rose-950/20';
    if (personality === 'cynic') return 'text-amber-400 border-amber-800/60 bg-amber-950/20';
    return 'text-sky-400 border-sky-800/60 bg-sky-950/20';
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-[480px]">
      {/* Header */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
        <div className="flex items-center space-x-2 text-zinc-200 font-semibold text-sm">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <span>Канал Дебатов и Дискуссий</span>
        </div>
        <span className="text-xs font-mono-data text-zinc-500">REALTIME COMM-LINK</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono-data text-xs">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 italic py-8">
            Начните дебаты! Объясните другим выжившим, почему ваша профессия и здоровье нужны в бункере.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`p-2.5 rounded-lg border space-y-1 ${
                m.is_bot
                  ? getBotColorClass(m.bot_personality)
                  : m.sender_id === currentUserId
                  ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-100 ml-4'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-200 mr-4'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <div className="flex items-center space-x-1.5">
                  {m.is_bot && <Bot className="w-3.5 h-3.5" />}
                  <span>{m.sender_name}</span>
                </div>
                <span className="text-[10px] opacity-60">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="leading-relaxed text-xs">{m.message}</p>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Reaction Chips */}
      <div className="px-3 py-2 bg-zinc-950/80 border-t border-zinc-800 flex space-x-2 overflow-x-auto text-[11px]">
        <button
          onClick={() => sendMessage('⚠️ Моя профессия и навыки критически важны для бункера!')}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded border border-amber-500/30 flex items-center space-x-1 flex-shrink-0 transition"
        >
          <ShieldCheck className="w-3 h-3 text-amber-400" />
          <span>Мой навык важен</span>
        </button>

        <button
          onClick={() => sendMessage('❓ Я не верю твоим аргументам, докажи полезность багажа!')}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-sky-300 rounded border border-sky-500/30 flex items-center space-x-1 flex-shrink-0 transition"
        >
          <HelpCircle className="w-3 h-3 text-sky-400" />
          <span>Не верю</span>
        </button>

        <button
          onClick={() => sendMessage('☠️ Нам нужно выгнать самого бесполезного для выживания!')}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-rose-300 rounded border border-rose-500/30 flex items-center space-x-1 flex-shrink-0 transition"
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>Голосуем</span>
        </button>
      </div>

      {/* Text Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className="p-3 bg-zinc-950 border-t border-zinc-800 flex space-x-2"
      >
        <input
          type="text"
          placeholder="Напишите сообщение в чат дебатов..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-sky-500 font-mono-data"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
