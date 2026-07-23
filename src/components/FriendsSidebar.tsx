'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Friend, Invite } from '@/types/game';
import { Users, X, UserPlus, Copy, Check, Radio, Bell } from 'lucide-react';

interface FriendsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userNickname: string;
  onJoinRoom: (code: string) => void;
}

export default function FriendsSidebar({
  isOpen,
  onClose,
  userId,
  userNickname,
  onJoinRoom,
}: FriendsSidebarProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate short deterministic code from userId
  const myFriendCode = `BK-${userId.slice(0, 4).toUpperCase()}`;

  useEffect(() => {
    if (!userId || !isOpen) return;

    fetchFriendsAndInvites();

    // Realtime subscription for incoming invites
    const channel = supabase
      .channel(`user_invites_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bunker_invites', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          setInvites((prev) => [payload.new as Invite, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isOpen]);

  const fetchFriendsAndInvites = async () => {
    const { data: fData } = await supabase
      .from('bunker_friends')
      .select('*')
      .eq('user_id', userId);
    if (fData) setFriends(fData);

    const { data: iData } = await supabase
      .from('bunker_invites')
      .select('*')
      .eq('recipient_id', userId)
      .eq('status', 'pending');
    if (iData) setInvites(iData);
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;

    setLoading(true);
    const targetCode = friendCodeInput.trim().toUpperCase();
    const mockFriendNickname = `Выживший_${targetCode.slice(-4)}`;

    await supabase.from('bunker_friends').insert({
      user_id: userId,
      friend_user_id: crypto.randomUUID(),
      friend_nickname: mockFriendNickname,
      friend_code: targetCode,
    });

    setFriendCodeInput('');
    setLoading(false);
    fetchFriendsAndInvites();
  };

  const handleSendInvite = async (friend: Friend) => {
    // Prompt room code if not currently in a room
    const code = prompt(`Отправить приглашение другу ${friend.friend_nickname}? Введите 6-значный код вашей комнаты:`);
    if (!code || code.trim().length < 4) return;

    await supabase.from('bunker_invites').insert({
      sender_id: userId,
      sender_name: userNickname,
      recipient_id: friend.friend_user_id,
      room_code: code.trim().toUpperCase(),
      status: 'pending',
    });

    alert(`Приглашение в комнату #${code.toUpperCase()} отправлено!`);
  };

  const handleAcceptInvite = async (invite: Invite) => {
    await supabase.from('bunker_invites').update({ status: 'accepted' }).eq('id', invite.id);
    setInvites((prev) => prev.filter((i) => i.id !== invite.id));
    onJoinRoom(invite.room_code);
    onClose();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myFriendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col transition-transform duration-300">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
        <div className="flex items-center space-x-2 text-zinc-100 font-semibold">
          <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span>Связь с Отрядом</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {/* User Code Card */}
        <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
          <div className="text-xs text-zinc-400 mb-1">Ваш персональный код выжившего:</div>
          <div className="flex items-center justify-between">
            <span className="font-mono-data font-bold text-emerald-400 text-lg">{myFriendCode}</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-1 text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано' : 'Копия'}</span>
            </button>
          </div>
        </div>

        {/* Incoming Invites */}
        {invites.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-1 text-xs font-bold text-rose-400 uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5" />
              <span>Входящие вызовы ({invites.length})</span>
            </div>
            {invites.map((inv) => (
              <div key={inv.id} className="p-3 bg-rose-950/20 border border-rose-800/50 rounded-lg space-y-2">
                <div className="text-xs text-zinc-200">
                  <span className="font-bold text-emerald-400">{inv.sender_name}</span> вызывает вас в комнату{' '}
                  <span className="font-mono-data font-bold text-rose-400">#{inv.room_code}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptInvite(inv)}
                    className="flex-1 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition"
                  >
                    Принять
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Friend Form */}
        <form onSubmit={handleAddFriend} className="space-y-2">
          <label className="text-xs text-zinc-400 font-medium">Добавить друга по коду:</label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="BK-XXXX"
              value={friendCodeInput}
              onChange={(e) => setFriendCodeInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-100 focus:outline-none focus:border-sky-500 uppercase font-mono-data"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center transition disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Friends List */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ваш отряд выживших</div>
          {friends.length === 0 ? (
            <div className="text-xs text-zinc-500 italic p-3 text-center border border-dashed border-zinc-800 rounded">
              Список друзей пуст. Поделитесь кодом со своими друзьями!
            </div>
          ) : (
            friends.map((f) => (
              <div
                key={f.id}
                className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between hover:border-zinc-700 transition"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  <div>
                    <div className="text-sm font-medium text-zinc-200">{f.friend_nickname}</div>
                    <div className="text-xs font-mono-data text-zinc-500">{f.friend_code}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleSendInvite(f)}
                  className="px-2 py-1 bg-zinc-800 hover:bg-sky-600 text-zinc-300 hover:text-white rounded text-xs font-medium transition"
                >
                  Пригласить
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
