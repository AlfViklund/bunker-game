'use client';

import React, { useState } from 'react';
import { Player, Room, BotPersonality } from '@/types/game';
import { generateUniqueBotProfile } from '@/lib/botGenerator';
import { supabase } from '@/lib/supabase';
import { Users, Shield, Bot, Play, CheckCircle2, Plus, AlertCircle, Minus, Loader2 } from 'lucide-react';

interface LobbyProps {
  room: Room;
  players: Player[];
  currentUserId: string;
  onStartGame: () => void;
  onUpdateBunkerSize?: (newSize: number) => void;
}

export default function Lobby({ room, players, currentUserId, onStartGame, onUpdateBunkerSize }: LobbyProps) {
  const [loadingBot, setLoadingBot] = useState(false);

  const me = players.find((p) => p.user_id === currentUserId);
  const isHost = me?.is_host || (players.length > 0 && (players[0].user_id === currentUserId || !me));
  const allReady = players.length >= 2 && players.every((p) => p.is_ready);

  const handleToggleReady = async () => {
    if (!me) return;
    await supabase.from('bunker_players').update({ is_ready: !me.is_ready }).eq('id', me.id);
  };

  const handleAddBot = async () => {
    if (players.length >= room.max_players) {
      alert(`Комната заполнена! Максимум ${room.max_players} игроков.`);
      return;
    }

    setLoadingBot(true);
    const profile = await generateUniqueBotProfile(room.catastrophe_title || undefined);

    await supabase.from('bunker_players').insert({
      room_id: room.id,
      user_id: crypto.randomUUID(),
      nickname: profile.nickname,
      is_bot: true,
      bot_personality: 'unique',
      is_host: false,
      is_ready: true,
      profession: profile.profession,
      health: profile.health,
      hobby: profile.hobby,
      phobia: profile.phobia,
      luggage: profile.luggage,
      extra_info: profile.extra_info,
      special_card: profile.special_card,
      backstory: profile.backstory,
      temperament: profile.temperament,
      revealed_fields: ['profession'],
    });

    setLoadingBot(false);
  };

  const handleBunkerSizeChange = async (delta: number) => {
    const newSize = Math.max(1, Math.min(room.max_players - 1, room.bunker_size + delta));
    if (newSize === room.bunker_size) return;

    if (onUpdateBunkerSize) {
      onUpdateBunkerSize(newSize);
    }

    await supabase.from('bunker_rooms').update({ bunker_size: newSize }).eq('id', room.id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Catastrophe Banner with Pollinations Concept Art */}
      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-3 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-500 font-bold text-sm uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Текущая катастрофа</span>
          </div>
          <div className="font-mono-data text-xs px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
            Вместимость укрытия: <span className="text-emerald-400 font-bold">{room.bunker_size} мест</span>
          </div>
        </div>

        {/* Generated Image Art */}
        {room.catastrophe_image_url && (
          <div className="relative w-full h-44 sm:h-56 rounded-lg overflow-hidden border border-zinc-800 shadow-inner">
            <img
              src={room.catastrophe_image_url}
              alt={room.catastrophe_title || 'Арт катастрофы'}
              className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            <div className="absolute bottom-3 left-3 text-[10px] font-mono-data text-amber-400 bg-zinc-950/90 px-2.5 py-1 rounded border border-zinc-800 flex items-center space-x-1.5 shadow">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>СМОТРОВАЯ КАМЕРА: ЗОНА КАТАСТРОФЫ</span>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-zinc-100">{room.catastrophe_title}</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">{room.catastrophe_desc}</p>
      </div>

      {/* Main Grid: Left Settings (Host), Right Player Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Column */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <div className="flex items-center space-x-2 text-zinc-200 font-semibold border-b border-zinc-800 pb-3">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Параметры Сессии</span>
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Код подключения:</span>
              <span className="font-mono-data font-bold text-emerald-400 text-base">{room.code}</span>
            </div>

            {/* Editable Bunker Size (N) */}
            <div className="space-y-1.5 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="text-xs text-zinc-400 flex justify-between items-center">
                <span>Вместимость бункера (N):</span>
                <span className="font-mono-data text-emerald-400 font-bold">{room.bunker_size} чел</span>
              </div>
              {isHost ? (
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleBunkerSizeChange(-1)}
                    disabled={room.bunker_size <= 1}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded text-zinc-200 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono-data text-xs text-zinc-300 font-bold">
                    Бункер вмещает {room.bunker_size} из {players.length}
                  </span>
                  <button
                    onClick={() => handleBunkerSizeChange(1)}
                    disabled={room.bunker_size >= room.max_players - 1}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded text-zinc-200 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic">Настраивается создателем сессии</div>
              )}
            </div>

            <div className="flex justify-between items-center text-zinc-400">
              <span>Игроков в лобби:</span>
              <span className="font-mono-data text-zinc-200">{players.length} / {room.max_players}</span>
            </div>
          </div>

          {isHost && (
            <div className="pt-2 space-y-2">
              <button
                onClick={handleAddBot}
                disabled={loadingBot || players.length >= room.max_players}
                className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-sky-400 border border-sky-500/30 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition"
              >
                {loadingBot ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                    <span>ГЕНЕРАЦИЯ ВЫЖИВШЕГО...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span>+ Добавить ИИ-Выжившего</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Players Grid */}
        <div className="md:col-span-2 p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2 text-zinc-200 font-semibold">
              <Users className="w-5 h-5 text-sky-400" />
              <span>Список Участников ({players.length})</span>
            </div>
            <div className="text-xs text-zinc-400">
              Минимум для старта: <span className="text-zinc-200 font-bold">2 выживших</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p) => (
              <div
                key={p.id}
                className={`p-3 rounded-lg border flex items-center justify-between transition ${
                  p.is_ready
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {p.is_bot ? (
                    <Bot className="w-5 h-5 text-sky-400" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  )}
                  <div>
                    <div className="text-sm font-semibold flex items-center space-x-1.5">
                      <span>{p.nickname}</span>
                      {p.is_host && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded">
                          ХОСТ
                        </span>
                      )}
                    </div>
                    {p.is_bot && (
                      <div className="text-[10px] text-sky-400 font-mono-data font-semibold">
                        ИИ-Выживший
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {p.is_ready ? (
                    <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ГОТОВ</span>
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono-data">ОЖИДАНИЕ</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleToggleReady}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition flex items-center justify-center space-x-2 ${
                me?.is_ready
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{me?.is_ready ? 'ОТМЕНИТЬ ГОТОВНОСТЬ' : 'Я ГОТОВ К ВЫЖИВАНИЮ'}</span>
            </button>

            {isHost && (
              <button
                onClick={onStartGame}
                disabled={!allReady}
                className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white rounded-lg font-bold text-sm transition flex items-center justify-center space-x-2 shadow-lg shadow-sky-950"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>ЗАПУСТИТЬ СЕССИЮ</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
