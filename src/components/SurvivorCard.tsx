'use client';

import React from 'react';
import { Player } from '@/types/game';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, HeartHandshake, Briefcase, Activity, Sparkles, AlertTriangle } from 'lucide-react';

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

  const isRevealed = (fieldKey: string) => {
    return isCurrentPlayer || (player.revealed_fields && player.revealed_fields.includes(fieldKey));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
      {/* Player Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="font-bold text-zinc-100">{player.nickname}</span>
          {player.is_bot && (
            <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 py-0.5 rounded font-mono-data">
              ИИ [{player.bot_personality}]
            </span>
          )}
        </div>
        {player.is_eliminated && (
          <span className="text-xs bg-rose-950/60 text-rose-400 border border-rose-800/60 px-2 py-0.5 rounded font-bold uppercase">
            Изгнан
          </span>
        )}
      </div>

      {/* Grid of 7 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields.map((f) => {
          const revealed = isRevealed(f.key);
          const Icon = f.icon;

          return (
            <motion.div
              key={f.key}
              whileHover={isCurrentPlayer && !revealed ? { scale: 1.02 } : {}}
              onClick={() => {
                if (isCurrentPlayer && !revealed) {
                  onRevealField(f.key);
                }
              }}
              className={`p-2.5 rounded-lg border transition cursor-pointer flex items-start space-x-2.5 ${
                revealed
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
                  : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-500 hover:border-sky-500/50'
              }`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${revealed ? 'text-sky-400' : 'text-zinc-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase font-mono-data text-zinc-400 font-semibold flex items-center justify-between">
                  <span>{f.label}</span>
                  {!revealed && <Lock className="w-3 h-3 text-zinc-500" />}
                </div>
                <div className="text-xs font-medium truncate mt-0.5">
                  {revealed ? f.value : <span className="italic text-zinc-500">[Засекречено]</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
