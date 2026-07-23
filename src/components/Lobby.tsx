'use client';

import React, { useState } from 'react';
import { Player, Room, BotPersonality } from '@/types/game';
import { BOT_NAMES, generateRandomSurvivorCard } from '@/lib/cardBank';
import { supabase } from '@/lib/supabase';
import { Users, Shield, Bot, Play, CheckCircle2, Plus, AlertCircle } from 'lucide-react';

interface LobbyProps {
  room: Room;
  players: Player[];
  currentUserId: string;
  onStartGame: () => void;
}

export default function Lobby({ room, players, currentUserId, onStartGame }: LobbyProps) {
  const [showBotModal, setShowBotModal] = useState(false);
  const [selectedBotPersonality, setSelectedBotPersonality] = useState<BotPersonality>('cynic');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    const card = generateRandomSurvivorCard();
    const botNamesPool = BOT_NAMES[selectedBotPersonality];
    const name = botNamesPool[Math.floor(Math.random() * botNamesPool.length)];

    await supabase.from('bunker_players').insert({
      room_id: room.id,
      user_id: crypto.randomUUID(),
      nickname: `${name} [ИИ]`,
      is_bot: true,
      bot_personality: selectedBotPersonality,
      is_host: false,
      is_ready: true,
      ...card,
      revealed_fields: ['profession'],
    });

    setLoading(false);
    setShowBotModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Catastrophe Banner */}
      <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-amber-500 font-bold text-sm uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            <span>Текущая катастрофа</span>
          </div>
          <div className="font-mono-data text-xs px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300">
            Вместимость укрытия: <span className="text-emerald-400 font-bold">{room.bunker_size} мест</span>
          </div>
        </div>
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

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-zinc-400">
              <span>Код подключения:</span>
              <span className="font-mono-data font-bold text-emerald-400 text-base">{room.code}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Всего мест в бункере:</span>
              <span className="font-mono-data text-zinc-200">{room.bunker_size} из {players.length}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>Игроков в лобби:</span>
              <span className="font-mono-data text-zinc-200">{players.length} / {room.max_players}</span>
            </div>
          </div>

          {isHost && (
            <div className="pt-2 space-y-2">
              <button
                onClick={() => setShowBotModal(true)}
                className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-sky-400 border border-sky-500/30 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition"
              >
                <Bot className="w-4 h-4" />
                <span>+ Добавить ИИ-Бота</span>
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
                      <div className="text-xs text-sky-400/80 uppercase font-mono-data">
                        Тип ИИ: {p.bot_personality}
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

      {/* Add Bot Selector Modal */}
      {showBotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center space-x-2">
                <Bot className="w-5 h-5 text-sky-400" />
                <span>Выбор Психотипа ИИ-Бота</span>
              </h3>
              <button onClick={() => setShowBotModal(false)} className="text-zinc-400 hover:text-zinc-100">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setSelectedBotPersonality('cynic')}
                className={`p-3 rounded-lg border cursor-pointer block transition ${
                  selectedBotPersonality === 'cynic'
                    ? 'bg-amber-950/30 border-amber-500 text-amber-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold text-sm">🟡 Циник (Cynic)</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Оценивает людей строго по сухому КПД профессии и полезности инструментов.
                </div>
              </label>

              <label
                onClick={() => setSelectedBotPersonality('panic')}
                className={`p-3 rounded-lg border cursor-pointer block transition ${
                  selectedBotPersonality === 'panic'
                    ? 'bg-rose-950/30 border-rose-500 text-rose-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold text-sm">🔴 Паникер (Panic)</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Эмоционален, жалуется на недостаток ресурсов, требует выгонять слабых.
                </div>
              </label>

              <label
                onClick={() => setSelectedBotPersonality('strategist')}
                className={`p-3 rounded-lg border cursor-pointer block transition ${
                  selectedBotPersonality === 'strategist'
                    ? 'bg-sky-950/30 border-sky-500 text-sky-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="font-bold text-sm">🔵 Стратег (Strategist)</div>
                <div className="text-xs text-zinc-400 mt-1">
                  Рассудителен, считает баланс специалистов и выстраивает союзы.
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowBotModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-sm font-medium"
              >
                Отмена
              </button>
              <button
                onClick={handleAddBot}
                disabled={loading}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded text-sm font-bold flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Добавить Бота</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
