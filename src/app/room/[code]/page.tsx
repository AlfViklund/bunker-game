'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Player, Room, Vote } from '@/types/game';
import Lobby from '@/components/Lobby';
import SurvivorCard from '@/components/SurvivorCard';
import ChatPhase from '@/components/ChatPhase';
import VotingConsole from '@/components/VotingConsole';
import EpiloguePhase from '@/components/EpiloguePhase';
import { ArrowLeft, Radio, AlertTriangle } from 'lucide-react';

import { getOrCreateGuestUser } from '@/lib/user';

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const resolvedParams = use(params);
  const code = resolvedParams.code.toUpperCase();
  const router = useRouter();

  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userNickname, setUserNickname] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const { userId: uid, nickname: nick } = getOrCreateGuestUser();
    setCurrentUserId(uid);
    setUserNickname(nick);

    fetchRoomData();
  }, [code]);

  // Realtime Subscriptions
  useEffect(() => {
    if (!room?.id) return;

    // 1. Room state updates
    const roomChannel = supabase
      .channel(`room_${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bunker_rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          setRoom(payload.new as Room);
        }
      )
      .subscribe();

    // 2. Players state updates
    const playersChannel = supabase
      .channel(`players_${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bunker_players', filter: `room_id=eq.${room.id}` },
        () => {
          fetchPlayers(room.id);
        }
      )
      .subscribe();

    // 3. Votes updates
    const votesChannel = supabase
      .channel(`votes_${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bunker_votes', filter: `room_id=eq.${room.id}` },
        () => {
          fetchVotes(room.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(votesChannel);
    };
  }, [room?.id]);

  // Trigger AI Bot turns when phase changes to debate or voting
  useEffect(() => {
    if (!room || !players.length) return;
    const me = players.find((p) => p.user_id === currentUserId);
    if (!me?.is_host) return; // Only host triggers bot API calls to prevent duplicate triggers

    const botPlayers = players.filter((p) => p.is_bot && !p.is_eliminated);
    if (botPlayers.length === 0) return;

    if (room.status === 'debate' || room.status === 'voting') {
      botPlayers.forEach((bot) => {
        fetch('/api/bot-turn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: room.id,
            botUserId: bot.user_id,
            phase: room.status,
          }),
        }).catch((err) => console.warn('Bot turn trigger error:', err));
      });
    }
  }, [room?.status, players, currentUserId]);

  const fetchRoomData = async () => {
    const { data: rData } = await supabase.from('bunker_rooms').select('*').eq('code', code).single();
    if (!rData) {
      alert('Комната не найдена!');
      router.push('/');
      return;
    }
    setRoom(rData);
    await fetchPlayers(rData.id);
    await fetchVotes(rData.id);
    setLoading(false);
  };

  const fetchPlayers = async (roomId: string) => {
    const { data } = await supabase.from('bunker_players').select('*').eq('room_id', roomId);
    if (data) setPlayers(data);
  };

  const fetchVotes = async (roomId: string) => {
    const { data } = await supabase.from('bunker_votes').select('*').eq('room_id', roomId);
    if (data) setVotes(data);
  };

  const handleTogglePhase = async () => {
    if (!room) return;
    const nextStatus = room.status === 'debate' ? 'voting' : 'debate';
    setRoom((prev) => (prev ? { ...prev, status: nextStatus } : null));

    await supabase
      .from('bunker_rooms')
      .update({ status: nextStatus })
      .eq('id', room.id);
  };

  const handleStartGame = async () => {
    if (!room) return;
    setRoom((prev) => (prev ? { ...prev, status: 'debate' } : null));
    await supabase.from('bunker_rooms').update({ status: 'debate' }).eq('id', room.id);
  };

  const handleRevealField = async (fieldKey: string) => {
    const me = players.find((p) => p.user_id === currentUserId);
    if (!me) return;

    const currentRevealed = me.revealed_fields || [];
    if (!currentRevealed.includes(fieldKey)) {
      const updated = [...currentRevealed, fieldKey];

      // Optimistic update local players state immediately
      setPlayers((prev) =>
        prev.map((p) => (p.user_id === currentUserId ? { ...p, revealed_fields: updated } : p))
      );

      await supabase.from('bunker_players').update({ revealed_fields: updated }).eq('id', me.id);
    }
  };

  const handleTallyVotes = async () => {
    if (!room || votes.length === 0) return;

    // Count votes per suspect
    const voteCounts: Record<string, number> = {};
    votes.forEach((v) => {
      voteCounts[v.suspect_id] = (voteCounts[v.suspect_id] || 0) + 1;
    });

    // Find highest voted
    let maxVotes = -1;
    let victimId = '';

    Object.entries(voteCounts).forEach(([suspectId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        victimId = suspectId;
      }
    });

    if (victimId) {
      // Mark eliminated
      await supabase.from('bunker_players').update({ is_eliminated: true }).eq('user_id', victimId).eq('room_id', room.id);
    }

    // Check remaining survivors vs bunker capacity
    const updatedPlayers = players.map((p) => (p.user_id === victimId ? { ...p, is_eliminated: true } : p));
    const activeSurvivors = updatedPlayers.filter((p) => !p.is_eliminated);

    if (activeSurvivors.length <= room.bunker_size) {
      // Trigger Epilogue API
      fetch('/api/epilogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id }),
      });
    } else {
      // Clear votes and return to debate for next round
      await supabase.from('bunker_votes').delete().eq('room_id', room.id);
      await supabase
        .from('bunker_rooms')
        .update({
          status: 'debate',
          current_round: room.current_round + 1,
        })
        .eq('id', room.id);
    }
  };

  const me = players.find((p) => p.user_id === currentUserId);
  const isHost = me?.is_host || (players.length > 0 && players[0].user_id === currentUserId);

  if (loading || !room) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-mono-data text-xs space-x-2">
        <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
        <span>ПОДКЛЮЧЕНИЕ К УБЕЖИЩУ #{code}...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 space-y-6">
      {/* Navbar Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push('/')}
            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="font-mono-data text-xs">
            УБЕЖИЩЕ <span className="text-emerald-400 font-bold">#{room.code}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {room.status !== 'lobby' && room.status !== 'epilogue' && (
            <button
              onClick={handleTogglePhase}
              className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded font-mono-data transition"
            >
              {room.status === 'debate' ? 'ПЕРЕЙТИ К ГОЛОСОВАНИЮ ➔' : '◄ ВЕРНУТЬСЯ К ДЕБАТАМ'}
            </button>
          )}

          <div className="text-xs px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded font-mono-data text-zinc-400">
            Раунд: <span className="text-emerald-400 font-bold">{room.current_round}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto">
        {room.status === 'lobby' && (
          <Lobby
            room={room}
            players={players}
            currentUserId={currentUserId}
            onStartGame={handleStartGame}
            onUpdateBunkerSize={(newSize) => setRoom((prev) => (prev ? { ...prev, bunker_size: newSize } : null))}
          />
        )}

        {(room.status === 'debate' || room.status === 'voting') && (
          <div className="space-y-6">
            {/* Top Bar: Catastrophe Summary with Pollinations Image */}
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
              <div className="flex items-center space-x-4">
                {room.catastrophe_image_url && (
                  <img
                    src={room.catastrophe_image_url}
                    alt={room.catastrophe_title || 'Арт'}
                    className="w-20 h-16 object-cover rounded-lg border border-zinc-800 flex-shrink-0"
                  />
                )}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{room.catastrophe_title}</span>
                  </div>
                  <div className="text-xs text-zinc-400 max-w-xl line-clamp-2">{room.catastrophe_desc}</div>
                </div>
              </div>

              <div className="font-mono-data text-xs px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-300 flex-shrink-0">
                Вместимость: <span className="text-emerald-400 font-bold">{room.bunker_size} мест</span> (Осталось:{' '}
                <span className="text-rose-400 font-bold">{players.filter((p) => !p.is_eliminated).length}</span>)
              </div>
            </div>

            {/* Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Survivor Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Карты Выживших (Кликните на свою закрытую карту, чтобы раскрыть её всем)
                </div>
                <div className="space-y-4">
                  {players.map((p) => (
                    <SurvivorCard
                      key={p.id}
                      player={p}
                      isCurrentPlayer={p.user_id === currentUserId}
                      onRevealField={handleRevealField}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column: Chat or Voting Console */}
              <div className="space-y-6">
                {room.status === 'debate' ? (
                  <ChatPhase
                    roomId={room.id}
                    currentUserId={currentUserId}
                    userNickname={userNickname}
                    players={players}
                  />
                ) : (
                  <VotingConsole
                    roomId={room.id}
                    currentUserId={currentUserId}
                    players={players}
                    votes={votes}
                    onTallyVotes={handleTallyVotes}
                    isHost={isHost}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {room.status === 'epilogue' && (
          <EpiloguePhase
            room={room}
            players={players}
            onReturnToLobby={() => supabase.from('bunker_rooms').update({ status: 'lobby' }).eq('id', room.id)}
          />
        )}
      </main>
    </div>
  );
}
