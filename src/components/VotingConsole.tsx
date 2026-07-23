'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Player, Vote } from '@/types/game';
import { supabase } from '@/lib/supabase';
import { Crosshair, ShieldAlert, Vote as VoteIcon } from 'lucide-react';

interface VotingConsoleProps {
  roomId: string;
  currentUserId: string;
  players: Player[];
  votes: Vote[];
  onTallyVotes: () => void;
  isHost: boolean;
}

export default function VotingConsole({
  roomId,
  currentUserId,
  players,
  votes,
  onTallyVotes,
  isHost,
}: VotingConsoleProps) {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const activePlayers = players.filter((p) => !p.is_eliminated);
  const myVote = votes.find((v) => v.voter_id === currentUserId);

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const startHoldToVote = (suspectId: string) => {
    if (myVote) return; // already voted
    setSelectedSuspectId(suspectId);
    setHoldProgress(0);

    const startTime = Date.now();
    const duration = 1200; // 1.2 seconds hold

    holdIntervalRef.current = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        await confirmVote(suspectId);
      }
    }, 30);
  };

  const cancelHoldToVote = () => {
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setHoldProgress(0);
  };

  const confirmVote = async (suspectId: string) => {
    await supabase.from('bunker_votes').upsert(
      {
        room_id: roomId,
        voter_id: currentUserId,
        suspect_id: suspectId,
      },
      { onConflict: 'room_id,voter_id' }
    );
  };

  const getVoteCountForPlayer = (userId: string) => {
    return votes.filter((v) => v.suspect_id === userId).length;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-2 text-rose-500 font-bold text-sm">
          <Crosshair className="w-5 h-5" />
          <span>Пульт Изгнания в Пустошь</span>
        </div>
        <div className="text-xs font-mono-data text-zinc-400">
          Проголосовало: <span className="text-rose-400 font-bold">{votes.length}</span> / {activePlayers.length}
        </div>
      </div>

      <p className="text-xs text-zinc-400">
        Удерживайте кнопку выжившего в течение 1.5 сек, чтобы подтвердить свой голос за его изгнание из бункера.
      </p>

      {/* Grid of Suspects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {activePlayers.map((p) => {
          const voteCount = getVoteCountForPlayer(p.user_id);
          const isSelected = selectedSuspectId === p.user_id;
          const isMySelectedVote = myVote?.suspect_id === p.user_id;

          return (
            <div
              key={p.id}
              onMouseDown={() => startHoldToVote(p.user_id)}
              onMouseUp={cancelHoldToVote}
              onMouseLeave={cancelHoldToVote}
              onTouchStart={() => startHoldToVote(p.user_id)}
              onTouchEnd={cancelHoldToVote}
              className={`relative overflow-hidden p-3 rounded-lg border cursor-pointer select-none transition ${
                isMySelectedVote
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200 shadow-lg shadow-rose-950'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {/* Progress Bar Fill Effect */}
              {isSelected && holdProgress > 0 && !myVote && (
                <div
                  className="absolute inset-0 bg-rose-600/30 transition-all duration-75"
                  style={{ width: `${holdProgress}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold flex items-center space-x-1.5">
                    <span>{p.nickname}</span>
                    {p.user_id === currentUserId && <span className="text-xs text-zinc-500">(Вы)</span>}
                  </div>
                  <div className="text-xs text-zinc-500">{p.profession}</div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <VoteIcon className={`w-4 h-4 ${voteCount > 0 ? 'text-rose-500' : 'text-zinc-600'}`} />
                  <span className="font-mono-data font-bold text-sm text-rose-400">{voteCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Tally Button */}
      {isHost && (
        <div className="pt-2">
          <button
            onClick={onTallyVotes}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-rose-950"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>ПОДВЕСТИ ИТОГИ ГОЛОСОВАНИЯ И ИЗГНАТЬ ЖЕРТВУ</span>
          </button>
        </div>
      )}
    </div>
  );
}
