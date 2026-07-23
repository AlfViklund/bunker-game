'use client';

import React, { useState, useEffect } from 'react';
import { Player, Room } from '@/types/game';
import confetti from 'canvas-confetti';
import { ShieldCheck, Skull, RotateCcw, Home, Terminal } from 'lucide-react';

interface EpiloguePhaseProps {
  room: Room;
  players: Player[];
  onReturnToLobby: () => void;
}

export default function EpiloguePhase({ room, players, onReturnToLobby }: EpiloguePhaseProps) {
  const [typedLog, setTypedLog] = useState('');
  const fullLog = room.epilogue_log || 'ИИ-бортовой журнал не сформировал историю.';

  const survivors = players.filter((p) => !p.is_eliminated);
  const eliminated = players.filter((p) => p.is_eliminated);

  useEffect(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Typewriter effect
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < fullLog.length) {
        setTypedLog(fullLog.slice(0, currentIndex + 1));
        currentIndex += 2; // Type 2 chars per tick for smooth speed
      } else {
        setTypedLog(fullLog);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [fullLog]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl text-center space-y-2">
        <h2 className="text-2xl font-bold text-emerald-400 font-mono-data tracking-wider uppercase">
          МИССИЯ ВЫЖИВАНИЯ ЗАВЕРШЕНА
        </h2>
        <p className="text-sm text-zinc-400">
          Запечатывание бункера выполнено. В бункер попало{' '}
          <span className="text-emerald-400 font-bold font-mono-data">{survivors.length}</span> из{' '}
          <span className="text-zinc-200 font-bold font-mono-data">{players.length}</span> выживших.
        </p>
      </div>

      {/* Survivor & Eliminated Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Survivors */}
        <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm uppercase">
            <ShieldCheck className="w-5 h-5" />
            <span>Попали в Бункер ({survivors.length})</span>
          </div>
          <div className="space-y-2">
            {survivors.map((s) => (
              <div key={s.id} className="p-2.5 bg-zinc-950 border border-emerald-900/50 rounded-lg text-xs">
                <div className="font-bold text-zinc-100">{s.nickname}</div>
                <div className="text-zinc-400 mt-0.5">
                  {s.profession} • Багаж: {s.luggage}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eliminated */}
        <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-sm uppercase">
            <Skull className="w-5 h-5" />
            <span>Изгнаны в Пустошь ({eliminated.length})</span>
          </div>
          <div className="space-y-2">
            {eliminated.length === 0 ? (
              <div className="text-xs text-zinc-500 italic p-2">Никто не был изгнан.</div>
            ) : (
              eliminated.map((e) => (
                <div key={e.id} className="p-2.5 bg-zinc-950 border border-rose-900/50 rounded-lg text-xs opacity-75">
                  <div className="font-bold text-zinc-300 line-through">{e.nickname}</div>
                  <div className="text-zinc-500 mt-0.5">{e.profession}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Vault Typewriter Log */}
      <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 font-mono-data">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 text-xs text-emerald-500">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4" />
            <span className="font-bold">БОРТОВОЙ ЖУРНАЛ УБЕЖИЩА — ХРОНИКИ (5 ЛЕТ)</span>
          </div>
          <button
            onClick={() => setTypedLog(fullLog)}
            className="text-[10px] text-zinc-500 hover:text-zinc-300 underline"
          >
            [ Показать полностью ]
          </button>
        </div>

        <div className="text-xs text-emerald-400/90 leading-relaxed whitespace-pre-line min-h-[140px]">
          {typedLog}
          <span className="animate-pulse">_</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-center space-x-4 pt-2">
        <button
          onClick={onReturnToLobby}
          className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-emerald-950"
        >
          <RotateCcw className="w-4 h-4" />
          <span>СЛЕДУЮЩИЙ РАУНД</span>
        </button>

        <button
          onClick={() => (window.location.href = '/')}
          className="py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold text-sm flex items-center space-x-2 transition border border-zinc-700"
        >
          <Home className="w-4 h-4" />
          <span>ГЛАВНОЕ МЕНЮ</span>
        </button>
      </div>
    </div>
  );
}
