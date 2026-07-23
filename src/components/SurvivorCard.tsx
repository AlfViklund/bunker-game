'use client';

import React from 'react';
import { Player } from '@/types/game';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, HeartHandshake, Briefcase, Activity, Sparkles, AlertTriangle, EyeOff } from 'lucide-react';

interface SurvivorCardProps {
  player: Player;
  isCurrentPlayer: boolean;
  onRevealField: (fieldKey: string) => void;
}

export default function SurvivorCard({ player, isCurrentPlayer, onRevealField }: SurvivorCardProps) {
  const fields = [
    { key: 'profession', label: 'Профессия', value: player.profession, icon: Briefcase },
    { key: 'health', label: 'Здоровье', value: player.health, icon: Activity },
    { key: 'hobby', label: 'Хобби', value: player.hobby, icon: HeartHandshake },
    { key: 'phobia', label: 'Фобия', value: player.phobia, icon: AlertTriangle },
    { key: 'luggage', label: 'Багаж', value: player.luggage, icon: Shield },
    { key: 'extra_info', label: 'Доп. Инфо', value: player.extra_info, icon: Sparkles },
    { key: 'special_card', label: 'Спец-Карта', value: player.special_card, icon: Lock },
  ];

  const isPubliclyRevealed = (fieldKey: string) => {
    return player.revealed_fields && player.revealed_fields.includes(fieldKey);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 shadow-lg">
      {/* Player Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span className="font-bold text-zinc-100">{player.nickname}</span>
          {isCurrentPlayer && <span className="text-xs text-emerald-400 font-mono-data font-bold">(Вы)</span>}
          {player.is_bot && (
            <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded font-mono-data">
              ИИ [{player.bot_personality}]
            </span>
          )}
        </div>
        {player.is_eliminated ? (
          <span className="text-xs bg-rose-950/60 text-rose-400 border border-rose-800/60 px-2 py-0.5 rounded font-bold uppercase">
            Изгнан
          </span>
        ) : (
          <div className="text-[11px] text-zinc-400 font-mono-data">
            Открыто карт: <span className="text-emerald-400 font-bold">{player.revealed_fields?.length || 0} / 7</span>
          </div>
        )}
      </div>

      {/* Grid of 7 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {fields.map((f) => {
          const publicRevealed = isPubliclyRevealed(f.key);
          const canSeeValue = isCurrentPlayer || publicRevealed;
          const Icon = f.icon;

          return (
            <motion.div
              key={f.key}
              initial={false}
              animate={{ rotateY: publicRevealed ? 0 : 0 }}
              transition={{ duration: 0.4 }}
              whileHover={isCurrentPlayer && !publicRevealed ? { scale: 1.02 } : {}}
              onClick={() => {
                if (isCurrentPlayer && !publicRevealed) {
                  onRevealField(f.key);
                }
              }}
              className={`p-3 rounded-lg border transition select-none ${
                isCurrentPlayer && !publicRevealed
                  ? 'cursor-pointer hover:border-emerald-500/80 bg-zinc-950/80 border-emerald-500/40 text-zinc-200'
                  : publicRevealed
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
                  : 'bg-zinc-800/30 border-zinc-800 text-zinc-500'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <Icon
                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    publicRevealed ? 'text-emerald-400' : isCurrentPlayer ? 'text-amber-400' : 'text-zinc-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase font-mono-data font-semibold flex items-center justify-between">
                    <span className={publicRevealed ? 'text-zinc-300' : 'text-zinc-400'}>{f.label}</span>
                    {publicRevealed ? (
                      <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1 py-0.2 rounded">
                        ОТКРЫТО
                      </span>
                    ) : isCurrentPlayer ? (
                      <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1 py-0.2 rounded flex items-center space-x-1">
                        <Eye className="w-2.5 h-2.5" />
                        <span>КЛИК — ПОКАЗАТЬ</span>
                      </span>
                    ) : (
                      <Lock className="w-3 h-3 text-zinc-600" />
                    )}
                  </div>

                  <div className="text-xs font-medium mt-1">
                    {canSeeValue ? (
                      <span className={publicRevealed ? 'text-zinc-100 font-semibold' : 'text-zinc-300 italic'}>
                        {f.value}
                      </span>
                    ) : (
                      <span className="italic text-zinc-600 flex items-center space-x-1">
                        <EyeOff className="w-3 h-3 inline mr-1 text-zinc-600" />
                        [Скрыто выжившим]
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
