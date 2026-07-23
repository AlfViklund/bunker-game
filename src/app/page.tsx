'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { generateRandomSurvivorCard } from '@/lib/cardBank';
import { CATASTROPHE_PRESETS } from '@/lib/pollinations';
import FriendsSidebar from '@/components/FriendsSidebar';
import { Shield, Play, Users, KeyRound, Radio, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [isFriendsOpen, setIsFriendsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // 1-Click Guest UUID setup
    let guestId = localStorage.getItem('bunker_guest_id');
    if (!guestId) {
      guestId = `guest-${crypto.randomUUID()}`;
      localStorage.setItem('bunker_guest_id', guestId);
    }
    setUserId(guestId);

    let savedNick = localStorage.getItem('bunker_guest_nick');
    if (!savedNick) {
      savedNick = `Выживший_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('bunker_guest_nick', savedNick);
    }
    setNickname(savedNick);
  }, []);

  const handleUpdateNickname = (newNick: string) => {
    setNickname(newNick);
    localStorage.setItem('bunker_guest_nick', newNick);
  };

  const handleCreateRoom = async () => {
    if (!nickname.trim()) return;
    setLoading(true);

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const catastrophe = CATASTROPHE_PRESETS[Math.floor(Math.random() * CATASTROPHE_PRESETS.length)];
    const card = generateRandomSurvivorCard();

    // Create Room
    const { data: room, error: rErr } = await supabase
      .from('bunker_rooms')
      .insert({
        code,
        status: 'lobby',
        catastrophe_title: catastrophe.title,
        catastrophe_desc: catastrophe.desc,
        catastrophe_image_url: `https://image.pollinations.ai/prompt/${encodeURIComponent(catastrophe.imagePrompt)}?width=800&height=450&nologo=true`,
        bunker_size: 3,
        max_players: 6,
      })
      .select()
      .single();

    if (rErr || !room) {
      alert('Ошибка при создании комнаты: ' + (rErr?.message || 'Неизвестно'));
      setLoading(false);
      return;
    }

    // Insert Host Player
    await supabase.from('bunker_players').insert({
      room_id: room.id,
      user_id: userId,
      nickname,
      is_host: true,
      is_ready: true,
      ...card,
      revealed_fields: ['profession'],
    });

    router.push(`/room/${code}`);
  };

  const handleJoinRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!roomCodeInput.trim() || !nickname.trim()) return;

    setLoading(true);
    const code = roomCodeInput.trim().toUpperCase();

    const { data: room } = await supabase.from('bunker_rooms').select('*').eq('code', code).single();

    if (!room) {
      alert(`Комната #${code} не найдена! Проверьте код.`);
      setLoading(false);
      return;
    }

    // Check if player already in room
    const { data: existing } = await supabase
      .from('bunker_players')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      const card = generateRandomSurvivorCard();
      await supabase.from('bunker_players').insert({
        room_id: room.id,
        user_id: userId,
        nickname,
        is_host: false,
        is_ready: false,
        ...card,
        revealed_fields: ['profession'],
      });
    }

    router.push(`/room/${code}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Background Military Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center space-x-2 font-mono-data font-bold text-lg text-emerald-400">
          <Shield className="w-6 h-6 text-emerald-500" />
          <span>БУНКЕР : 2077</span>
        </div>

        <button
          onClick={() => setIsFriendsOpen(true)}
          className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold flex items-center space-x-2 transition text-zinc-300"
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>Отряд Друзей</span>
        </button>
      </header>

      {/* Main Content Card */}
      <main className="max-w-md mx-auto w-full space-y-6 my-auto z-10 py-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold font-mono-data tracking-wider uppercase text-zinc-100">
            ИИ-ХРОНИКИ ВЫЖИВАНИЯ
          </h1>
          <p className="text-xs text-zinc-400">
            Постапокалиптическая Party-игра с ИИ-ботами и динамическими катастрофами
          </p>
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-5 shadow-2xl">
          {/* Guest Nickname Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ваш позывной выжившего:</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => handleUpdateNickname(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          {/* Action 1: Create Room */}
          <button
            onClick={handleCreateRoom}
            disabled={loading || !nickname.trim()}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-950"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>СОЗДАТЬ НОВУЮ СЕССИЮ</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800" />
            <span className="flex-shrink mx-4 text-[10px] uppercase font-mono-data text-zinc-500">
              Или подключитесь по коду
            </span>
            <div className="flex-grow border-t border-zinc-800" />
          </div>

          {/* Action 2: Join Room */}
          <form onSubmit={handleJoinRoom} className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="КОД (например: A91F4B)"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 uppercase font-mono-data focus:outline-none focus:border-sky-500"
              />
              <button
                type="submit"
                disabled={loading || !roomCodeInput.trim()}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold flex items-center space-x-1 transition shadow-lg shadow-sky-950"
              >
                <KeyRound className="w-4 h-4" />
                <span>ВОЙТИ</span>
              </button>
            </div>
          </form>
        </div>

        {/* Tactical Info Footer */}
        <div className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-lg flex items-center justify-between text-xs text-zinc-500 font-mono-data">
          <div className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>СЕРВЕР: ONLINE</span>
          </div>
          <span>ВЕРСИЯ: 1.0.0</span>
        </div>
      </main>

      {/* Friends Drawer */}
      <FriendsSidebar
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        userId={userId}
        userNickname={nickname}
        onJoinRoom={(code) => router.push(`/room/${code}`)}
      />

      <footer className="text-center text-xs text-zinc-600 font-mono-data py-2 z-10">
        © 2026 Бункер 2077 • Next.js 16 + Supabase Realtime + Pollinations.ai
      </footer>
    </div>
  );
}
